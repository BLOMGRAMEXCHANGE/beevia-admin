import { humanizeToken } from "@/lib/format";
import type { StatusTone } from "@/components/shared/status-badge";
import type {
  ReportFilterDef,
  ReportRow,
  ReportType,
} from "@/features/reports/types";

/**
 * Presentation rules for server-driven report data. Nothing here knows about a
 * specific report type: a cell is formatted from its column key and the shape
 * of its value, so a report type the frontend has never seen still renders
 * dates as dates and money as naira.
 */

const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
/** A decimal string the backend uses for money, e.g. `"71000.00"`. */
const DECIMAL_STRING = /^-?\d+(\.\d+)?$/;
/**
 * Keys that hold money. Deliberately narrow: a JSON number under a key like
 * `total_signups` is a count, and must not render as naira.
 */
const MONEY_KEY = /(amount|balance|volume|credited|debited|fee)/i;
const COUNT_KEY = /(count|entries|rows|signups|users)/i;
/**
 * Digit strings that are identifiers, not quantities — `08012345678` must not
 * become "8,012,345,678".
 */
const VERBATIM_DIGITS_KEY =
  /(phone|msisdn|mobile|bvn|nin|account_?number|accountNumber|otp|pin|code)/i;
/** Long opaque identifiers — rendered de-emphasised and monospaced. */
const ID_KEY = /(^id$|_id$|Id$|reference)/;

function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function toCamelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

/**
 * Reads a column's value out of a row. Column keys are camelCase
 * (`balanceAfter`) while preview rows come back snake_case (`balance_after`),
 * so both spellings are tried rather than assuming either one.
 */
export function readCell(row: ReportRow, key: string): unknown {
  if (key in row) return row[key];
  const snake = toSnakeCase(key);
  if (snake in row) return row[snake];
  const camel = toCamelCase(key);
  if (camel in row) return row[camel];
  return undefined;
}

const numberFormat = new Intl.NumberFormat("en-US");
/** Reports are an accounting surface — money always shows its kobo. */
const moneyFormat = new Intl.NumberFormat("en-NG", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** `₦71,000.00` for naira (or no stated currency), `USD 1,250.00` otherwise. */
export function formatReportMoney(amount: number, currency?: string): string {
  const formatted = moneyFormat.format(amount);
  if (!currency || currency.toUpperCase() === "NGN") {
    return amount < 0 ? `-₦${formatted.slice(1)}` : `₦${formatted}`;
  }
  return `${currency.toUpperCase()} ${formatted}`;
}

export function formatReportDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatReportDate(iso: string): string {
  // A bare `yyyy-mm-dd` parses as UTC midnight, which is the previous day west
  // of Greenwich — pin it to local midnight so the calendar date is preserved.
  const date = ISO_DATE_ONLY.test(iso) ? `${iso}T00:00:00` : iso;
  return new Date(date).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * The requested window as calendar dates. The API echoes it back as UTC
 * boundaries (`…T00:00:00.000Z` to `…T23:59:59.999Z`); read through a local
 * clock, the end would roll into the next day in Lagos, so only the date part
 * is used.
 */
export function formatReportWindow(dateFrom: string, dateTo: string): string {
  return `${formatReportDate(dateFrom.slice(0, 10))} – ${formatReportDate(
    dateTo.slice(0, 10)
  )}`;
}

/** Placeholder for empty cells — an absent value is not the same as zero. */
export const EMPTY_CELL = "—";

/**
 * Value labels per column key, taken from the report type's own filter
 * definitions — so `escrow_hold` reads "Escrow hold" exactly as the backend
 * words it, rather than a guessed humanisation.
 */
export type ValueLabels = Record<string, Record<string, string>>;

export function valueLabelsFor(filters: ReportFilterDef[] = []): ValueLabels {
  return Object.fromEntries(
    filters.map((filter) => [
      filter.key,
      Object.fromEntries(
        filter.options.map((option) => [option.value, option.label])
      ),
    ])
  );
}

export interface FormatOptions {
  /** Currency of the row, when it has one. */
  currency?: string;
  labels?: ValueLabels;
}

/**
 * Formats one cell for display. Order matters: value shape (ISO timestamp,
 * decimal string) is checked before key-name heuristics, so a well-typed value
 * never depends on the backend naming a column a particular way.
 */
export function formatReportValue(
  key: string,
  value: unknown,
  { currency, labels }: FormatOptions = {}
): string {
  if (value === null || value === undefined || value === "") return EMPTY_CELL;
  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (typeof value === "number") {
    return MONEY_KEY.test(key) && !COUNT_KEY.test(key)
      ? formatReportMoney(value, currency)
      : numberFormat.format(value);
  }

  if (typeof value === "string") {
    if (ISO_DATE_TIME.test(value)) return formatReportDateTime(value);
    if (ISO_DATE_ONLY.test(value)) return formatReportDate(value);
    const label = labels?.[toCamelCase(key)]?.[value];
    if (label) return label;
    // A leading zero is never how a quantity is written.
    if (VERBATIM_DIGITS_KEY.test(key) || /^0\d/.test(value)) return value;
    if (DECIMAL_STRING.test(value)) {
      const parsed = Number.parseFloat(value);
      // The backend sends money as a 2dp decimal string and counts as JSON
      // numbers, so a trailing `.00` is itself a signal — not just the key.
      const isMoney =
        (MONEY_KEY.test(key) || /\.\d{2}$/.test(value)) && !COUNT_KEY.test(key);
      return isMoney
        ? formatReportMoney(parsed, currency)
        : numberFormat.format(parsed);
    }
    // Enum-ish tokens (`chat_banking`, `escrow_hold`) read as labels; free
    // text (descriptions, names) is left exactly as the backend sent it.
    if (isTokenColumn(key) && /^[a-z0-9]+(_[a-z0-9]+)*$/.test(value)) {
      return humanizeToken(value);
    }
    return value;
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => formatReportValue(key, item, { currency, labels }))
      .filter((part) => part !== EMPTY_CELL);
    return parts.length > 0 ? parts.join(", ") : EMPTY_CELL;
  }

  if (typeof value === "object") return describeEntity(value);

  return String(value);
}

/** Fields that name a person or thing, most human-friendly first. */
const ENTITY_NAME_KEYS = [
  "name",
  "full_name",
  "fullName",
  "label",
  "title",
  "username",
  "email",
  "id",
];

/**
 * Reduces an embedded object (an audit `actor` or `target`, say — shaped like
 * `requested_by`) to its most readable name, instead of "[object Object]".
 */
function describeEntity(value: object): string {
  const record = value as Record<string, unknown>;
  for (const key of ENTITY_NAME_KEYS) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }
  for (const [key, candidate] of Object.entries(record)) {
    if (/(^|_)id$|Id$/.test(key) && typeof candidate === "string") {
      return candidate;
    }
  }
  return EMPTY_CELL;
}

/**
 * Free text long enough that it should wrap in a table cell rather than
 * stretch the row (an audit `summary`, a transaction `description`).
 */
export function isLongText(text: string): boolean {
  return text.length > 48 && /\s/.test(text);
}

const TOKEN_KEYS = new Set([
  "status",
  "type",
  "direction",
  "verification",
  "accountType",
  "action",
  "module",
  "targetType",
]);

function isTokenColumn(key: string): boolean {
  return TOKEN_KEYS.has(toCamelCase(key));
}

/** Columns rendered as a badge rather than plain text. */
const BADGE_KEYS = new Set(["status", "verification", "direction"]);

export function isBadgeColumn(key: string): boolean {
  return BADGE_KEYS.has(toCamelCase(key));
}

const TONE_BY_VALUE: Record<string, StatusTone> = {
  // Positive / settled
  completed: "green",
  verified: "green",
  active: "green",
  ready: "green",
  credit: "green",
  // In-flight
  pending: "amber",
  queued: "amber",
  running: "amber",
  processing: "amber",
  restricted: "amber",
  // Negative
  failed: "red",
  reversed: "red",
  suspended: "red",
  // Inert
  debit: "slate",
  deactivated: "slate",
  deleted: "gray",
};

export function toneForValue(value: unknown): StatusTone {
  if (typeof value !== "string") return "gray";
  return TONE_BY_VALUE[value.toLowerCase()] ?? "gray";
}

export function isIdColumn(key: string): boolean {
  return ID_KEY.test(key);
}

/**
 * A totals entry, ready to render. Totals are open-keyed per report type
 * (`credited`/`debited`/`entries` for transactions, counts elsewhere), so the
 * label is derived from the key and the value formatted by the same rules as
 * a table cell.
 */
export interface ReportTotalEntry {
  key: string;
  label: string;
  value: string;
}

export interface ReportBreakdownItem {
  key: string;
  label: string;
  /** Formatted for display. */
  value: string;
  /** The raw count, when the value is one — drives the proportion bar. */
  count: number | null;
  /** Share of the group total, 0–100, when every item is a count. */
  percent: number | null;
  tone: StatusTone | null;
}

/** A grouped total, e.g. signups `by_verification` → verified/pending/failed. */
export interface ReportBreakdown {
  key: string;
  label: string;
  items: ReportBreakdownItem[];
  /** Sum of the counts, or null when the group isn't all counts. */
  total: number | null;
}

export interface ReportTotalsView {
  stats: ReportTotalEntry[];
  breakdowns: ReportBreakdown[];
}

function toCount(key: string, value: unknown): number | null {
  if (MONEY_KEY.test(key)) return null;
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value)
        ? Number(value)
        : Number.NaN;
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

/**
 * Splits the totals block into headline figures and breakdowns. A nested
 * object is a breakdown; its key (`by_verification`, `account_type`) names the
 * dimension, which is matched to the report type's filter of the same name so
 * the title and every value use the catalogue's wording ("Account type",
 * "Chat banking") rather than a humanised guess.
 */
export function toTotalsView(
  totals: Record<string, unknown> | null | undefined,
  type?: ReportType
): ReportTotalsView {
  const view: ReportTotalsView = { stats: [], breakdowns: [] };
  if (!totals) return view;

  for (const [key, value] of Object.entries(totals)) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      view.stats.push({
        key,
        label: humanizeToken(key),
        value: formatReportValue(key, value),
      });
      continue;
    }

    const dimension = toCamelCase(key.replace(/^by_?/i, ""));
    const filter = type?.filters.find(
      (candidate) => toCamelCase(candidate.key) === dimension
    );
    const entries = Object.entries(value as Record<string, unknown>);
    const counts = entries.map(([childKey, childValue]) =>
      toCount(childKey, childValue)
    );
    const allCounts = counts.every((count) => count !== null);
    const total = allCounts
      ? counts.reduce<number>((sum, count) => sum + (count ?? 0), 0)
      : null;

    view.breakdowns.push({
      key,
      label: filter?.label ?? humanizeToken(key.replace(/^by_?/i, "")),
      total,
      items: entries.map(([childKey, childValue], index) => {
        const count = counts[index];
        return {
          key: childKey,
          label:
            filter?.options.find((option) => option.value === childKey)
              ?.label ?? humanizeToken(childKey),
          value: formatReportValue(childKey, childValue),
          count,
          percent:
            total && count !== null
              ? (count / total) * 100
              : total === 0
                ? 0
                : null,
          tone: TONE_BY_VALUE[childKey.toLowerCase()] ?? null,
        };
      }),
    });
  }
  return view;
}

export interface AppliedFilter {
  key: string;
  label: string;
  value: string;
}

/**
 * A report's filters as `Label: Value` pairs, worded from the catalogue when
 * the type is known and humanised from the raw keys when it isn't (a report
 * reopened after its type left the catalogue still reads sensibly).
 */
export function describeFilters(
  filters: Record<string, string>,
  type: ReportType | undefined
): AppliedFilter[] {
  return Object.entries(filters)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => {
      const def = type?.filters.find((filter) => filter.key === key);
      return {
        key,
        label: def?.label ?? humanizeToken(key),
        value:
          def?.options.find((option) => option.value === value)?.label ??
          humanizeToken(value),
      };
    });
}
