import {
  TRANSACTION_TYPE_LABEL,
  TRANSACTION_TYPE_OPTIONS,
} from "@/features/wallet/constants";
import type { WalletTransactionType } from "@/features/wallet/types";
import { buildReconciliationRun } from "@/features/reconciliation/mock-data";
import type { DiscrepancyType } from "@/features/reconciliation/types";
import { MOCK_PEOPLE } from "@/features/pending-transfers/mock-data";
import type {
  ActivityEvent,
  ActivityEventType,
} from "@/features/dashboard/mock/activity";
import type {
  AccountTypeFilter,
  GeneratedReport,
  RecentReport,
  ReconciliationSummary,
  ReportParams,
  ReportTypeId,
  TransactionFinancialStats,
  TransactionTypeFilter,
  TransactionTypeRow,
  UserKycStats,
} from "@/features/reports/types";

/**
 * MOCK DATA ONLY — there is no reports backend yet. `api.ts` is the single seam
 * where real generation / history endpoints get wired in.
 */

/**
 * Mock "recent reports" history — 8 entries spanning all three report types
 * with realistic dates (relative to a fixed reference so the list is stable).
 */
export function buildRecentReports(base: number = Date.now()): RecentReport[] {
  const day = 24 * 60 * 60 * 1000;
  const at = (daysAgo: number) => new Date(base - daysAgo * day).toISOString();

  const rows: Omit<RecentReport, "id">[] = [
    {
      typeId: "transaction_financial",
      params: range("2026-08-01", "2026-08-31"),
      generatedAt: at(1),
    },
    {
      typeId: "user_kyc",
      params: { ...range("2026-08-01", "2026-08-31"), accountType: "all" },
      generatedAt: at(1),
    },
    {
      typeId: "admin_activity",
      params: range("2026-08-18", "2026-08-24"),
      generatedAt: at(3),
    },
    {
      typeId: "transaction_financial",
      params: range("2026-08-11", "2026-08-17"),
      generatedAt: at(8),
    },
    {
      typeId: "user_kyc",
      params: {
        ...range("2026-07-01", "2026-07-31"),
        accountType: "chat_banking",
      },
      generatedAt: at(14),
    },
    {
      typeId: "admin_activity",
      params: range("2026-07-01", "2026-07-31"),
      generatedAt: at(21),
    },
    {
      typeId: "transaction_financial",
      params: range("2026-07-01", "2026-07-31"),
      generatedAt: at(21),
    },
    {
      typeId: "user_kyc",
      params: { ...range("2026-06-01", "2026-06-30"), accountType: "all" },
      generatedAt: at(40),
    },
  ];

  return rows.map((row, index) => ({ id: `report-${index + 1}`, ...row }));
}

function range(from: string, to: string): ReportParams {
  return { range: { from, to } };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Inclusive day count for a `yyyy-mm-dd` range; never negative. */
function rangeDays(from: string, to: string): number {
  const fromMs = Date.parse(`${from}T00:00:00`);
  const toMs = Date.parse(`${to}T00:00:00`);
  if (Number.isNaN(fromMs) || Number.isNaN(toMs) || toMs < fromMs) return 0;
  return Math.round((toMs - fromMs) / DAY_MS) + 1;
}

/** Small deterministic 0..1 jitter seeded by a string (so different ranges of
 *  the same length don't produce identical numbers). */
function seededUnit(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

/** Share of new signups that are "Chat Only" (the rest are "Chat + Banking"). */
const CHAT_ONLY_SHARE = 0.62;

/**
 * MOCK aggregate figures for the User & KYC report.
 *
 * Not a real calculation — it scales a per-day signup rate by the length of the
 * selected range and the account-type segment, with a little range-seeded
 * jitter, so the numbers move sensibly with the filters instead of being static.
 * Replace this whole function with a real API response mapper later; the shape
 * (`UserKycStats`) is what the UI and CSV export depend on.
 */
export function buildUserKycStats(params: ReportParams): UserKycStats {
  const accountType: AccountTypeFilter = params.accountType ?? "all";
  const days = rangeDays(params.range.from, params.range.to);

  const jitter =
    0.85 + seededUnit(`${params.range.from}|${params.range.to}`) * 0.3;
  const perDayAllTypes = 4.6;
  const segmentShare =
    accountType === "chat_only"
      ? CHAT_ONLY_SHARE
      : accountType === "chat_banking"
        ? 1 - CHAT_ONLY_SHARE
        : 1;

  const totalSignups = Math.round(
    days * perDayAllTypes * jitter * segmentShare
  );

  // verified + pending + failed always === totalSignups
  const verified = Math.round(totalSignups * 0.83);
  const failed = Math.round(totalSignups * 0.06);
  const pending = Math.max(0, totalSignups - verified - failed);

  // Breakdown of the *total for this run* by account type. When a specific
  // segment is selected the whole total sits in that segment.
  const chatOnly =
    accountType === "chat_banking"
      ? 0
      : accountType === "chat_only"
        ? totalSignups
        : Math.round(totalSignups * CHAT_ONLY_SHARE);
  const chatBanking = totalSignups - chatOnly;

  return {
    accountType,
    totalSignups,
    verified,
    pending,
    failed,
    breakdown: { chatOnly, chatBanking },
  };
}

// ---------------------------------------------------------------------------
// Transaction & Financial report (RP3)
// ---------------------------------------------------------------------------

/** Per-type mock profile: rough daily transaction count and average value. */
const TXN_TYPE_PROFILE: Record<
  WalletTransactionType,
  { perDay: number; avg: number }
> = {
  wallet_funding_bank: { perDay: 5.5, avg: 85_000 },
  wallet_funding_card: { perDay: 3.2, avg: 32_000 },
  p2p_send: { perDay: 6, avg: 18_000 },
  p2p_receive: { perDay: 6, avg: 18_000 },
  external_transfer: { perDay: 2.4, avg: 120_000 },
  card_spend: { perDay: 4, avg: 9_500 },
};

const ALL_TXN_TYPES = TRANSACTION_TYPE_OPTIONS.map((o) => o.value);

/** Whether the selected period overlaps the calendar month of `now`. Drives
 *  which reconciliation scenario the report shows (see `ReconciliationSummary`). */
export function periodHasReconciliationRun(
  params: ReportParams,
  now: number = Date.now()
): boolean {
  const today = new Date(now);
  const startOfMonth = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`;
  const endOfMonth = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-31`;
  return params.range.to >= startOfMonth && params.range.from <= endOfMonth;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function reconciliationSummary(
  params: ReportParams,
  now: number
): ReconciliationSummary {
  if (!periodHasReconciliationRun(params, now)) {
    // No reconciliation covered this period — explicit "not run" state, never
    // fabricated zeros.
    return { status: "not_run" };
  }

  // A run occurred. Reuse the Reconciliation feature's own mock to get a
  // realistic small discrepancy set for the window, then count by category.
  const run = buildReconciliationRun(
    { dateFrom: params.range.from, dateTo: params.range.to },
    now
  );
  const counts: Record<DiscrepancyType, number> = {
    missing_in_anchor: 0,
    missing_in_beevia: 0,
    amount_mismatch: 0,
  };
  for (const discrepancy of run.discrepancies) counts[discrepancy.type] += 1;

  // If the window sits inside the current month but past the canonical
  // discrepancy dates, `buildReconciliationRun` returns none. A run still
  // happened, so seed a small realistic set rather than showing an all-clear
  // that wasn't really this period's result.
  const total =
    counts.missing_in_anchor +
    counts.missing_in_beevia +
    counts.amount_mismatch;
  if (total === 0) {
    const seed = seededUnit(`${params.range.from}|${params.range.to}|recon`);
    counts.missing_in_anchor = 1 + Math.floor(seed * 3); // 1–3
    counts.missing_in_beevia = 1 + Math.floor(seededUnit(`${seed}|b`) * 2); // 1–2
    counts.amount_mismatch = Math.floor(seededUnit(`${seed}|c`) * 2); // 0–1
  }

  return { status: "ran", ranAt: new Date(now).toISOString(), counts };
}

/**
 * MOCK aggregate figures for the Transaction & Financial report.
 *
 * Not a real calculation — per-type count/volume scale with the selected range
 * length and a range-seeded jitter, so numbers move with the filters. Replace
 * this whole function with a real API response mapper later; the UI and CSV
 * export depend only on the `TransactionFinancialStats` shape.
 */
export function buildTransactionFinancialStats(
  params: ReportParams,
  now: number = Date.now()
): TransactionFinancialStats {
  const transactionType: TransactionTypeFilter =
    params.transactionType ?? "all";
  const days = rangeDays(params.range.from, params.range.to);

  const rows: TransactionTypeRow[] = ALL_TXN_TYPES.map((type) => {
    const profile = TXN_TYPE_PROFILE[type];
    const countJitter =
      0.8 + seededUnit(`${params.range.from}|${params.range.to}|${type}`) * 0.4;
    const count = Math.round(days * profile.perDay * countJitter);
    const volJitter =
      0.9 +
      seededUnit(`${params.range.from}|${params.range.to}|${type}|v`) * 0.2;
    const volume = Math.round((count * profile.avg * volJitter) / 100) * 100;
    return { type, label: TRANSACTION_TYPE_LABEL[type], volume, count };
  });

  const breakdown =
    transactionType === "all"
      ? rows
      : rows.filter((row) => row.type === transactionType);

  const totalVolume = breakdown.reduce((sum, row) => sum + row.volume, 0);
  const totalCount = breakdown.reduce((sum, row) => sum + row.count, 0);

  return {
    transactionType,
    totalVolume,
    totalCount,
    breakdown,
    reconciliation: reconciliationSummary(params, now),
  };
}

// ---------------------------------------------------------------------------
// Admin Activity / Audit report (RP4)
// ---------------------------------------------------------------------------

/** mulberry32 — small seedable PRNG, for a deterministic mock event stream. */
function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ADMIN_NAMES = [
  "Ada Admin",
  "Cam Compliance",
  "Sam Support",
  "Rita Reviewer",
  "Owen Ops",
  "Priya Payments",
];
const ADMIN_ROLES = [
  "Support",
  "Compliance",
  "Finance",
  "Read Only",
  "Super Admin",
];
const INVITE_EMAILS = [
  "jordan.blake",
  "nadia.hart",
  "victor.paul",
  "leah.stone",
  "chris.dunn",
  "sara.lin",
  "mo.idris",
  "tara.quinn",
];
const USER_ACTIONS = [
  "suspended",
  "restricted",
  "activated",
  "deactivated",
] as const;
const ADMIN_ACCOUNT_ACTIONS = ["deactivated", "reactivated"] as const;

const ADMIN_ACTIVITY_TYPES: ActivityEventType[] = [
  "admin_invited",
  "admin_role_changed",
  "admin_account_status_changed",
  "user_status_changed",
];

let cachedAdminActivity: { base: number; events: ActivityEvent[] } | null =
  null;

/**
 * MOCK DATA — a deterministic stream of ~56 admin/audit events spanning ~140
 * days back from `base`, newest-first. Reuses Dashboard Home's `ActivityEvent`
 * model and the four event types it renders. `api.ts` is the single seam where
 * a real `GET /admin/activity` endpoint gets wired in.
 */
export function buildAdminActivityDataset(
  base: number = Date.now()
): ActivityEvent[] {
  if (cachedAdminActivity && cachedAdminActivity.base === base) {
    return cachedAdminActivity.events;
  }

  const rng = makeRng(0x9e3779b9 ^ (base & 0xffffffff));
  const pick = <T>(items: readonly T[]): T =>
    items[Math.floor(rng() * items.length)];

  const COUNT = 56;
  const SPAN_DAYS = 140;
  const events: ActivityEvent[] = [];

  for (let i = 0; i < COUNT; i += 1) {
    // Spread timestamps across the span, oldest → newest, with jitter.
    const dayOffset =
      SPAN_DAYS - (i / COUNT) * SPAN_DAYS - rng() * (SPAN_DAYS / COUNT);
    const createdAt = new Date(
      base - Math.max(0, dayOffset) * DAY_MS - Math.floor(rng() * DAY_MS)
    ).toISOString();
    const actor = pick(ADMIN_NAMES);
    const type = ADMIN_ACTIVITY_TYPES[i % ADMIN_ACTIVITY_TYPES.length];
    const id = `adm-act-${i + 1}`;

    if (type === "admin_invited") {
      events.push({
        id,
        type,
        createdAt,
        actor,
        email: `${pick(INVITE_EMAILS)}@beevia.dev`,
        role: pick(ADMIN_ROLES),
      });
    } else if (type === "admin_role_changed") {
      events.push({
        id,
        type,
        createdAt,
        actor,
        target: pick(ADMIN_NAMES.filter((name) => name !== actor)),
        role: pick(ADMIN_ROLES),
      });
    } else if (type === "admin_account_status_changed") {
      events.push({
        id,
        type,
        createdAt,
        actor,
        target: pick(ADMIN_NAMES.filter((name) => name !== actor)),
        action: pick(ADMIN_ACCOUNT_ACTIONS),
      });
    } else {
      const person = pick(MOCK_PEOPLE);
      events.push({
        id,
        type,
        createdAt,
        actor,
        user: person.name,
        userId: person.id,
        action: pick(USER_ACTIONS),
      });
    }
  }

  events.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  cachedAdminActivity = { base, events };
  return events;
}

function withinDateRange(
  iso: string,
  range: { from: string; to: string }
): boolean {
  const time = new Date(iso).getTime();
  const fromMs = Date.parse(`${range.from}T00:00:00`);
  const toMs = Date.parse(`${range.to}T23:59:59.999`);
  if (Number.isNaN(fromMs) || Number.isNaN(toMs)) return false;
  return time >= fromMs && time <= toMs;
}

/**
 * The Admin Activity / Audit report is a chronological list, not an aggregate:
 * the full filtered, newest-first event set plus its total count. Pagination is
 * applied by the UI over the whole set; the CSV export uses the whole set too.
 */
export function buildAdminActivityReport(
  params: ReportParams,
  base: number = Date.now()
): { totalActions: number; events: ActivityEvent[] } {
  const typeFilter = params.adminActivityType ?? "all";
  const events = buildAdminActivityDataset(base).filter(
    (event) =>
      withinDateRange(event.createdAt, params.range) &&
      (typeFilter === "all" || event.type === typeFilter)
  );
  return { totalActions: events.length, events };
}

export function buildGeneratedReport(
  typeId: ReportTypeId,
  params: ReportParams,
  base: number = Date.now()
): GeneratedReport {
  return { typeId, params, generatedAt: new Date(base).toISOString() };
}
