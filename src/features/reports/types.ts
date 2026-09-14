/**
 * Reports are server-driven. The backend owns the catalogue
 * (`GET /admin/reports/types`) — which report types exist, what columns each
 * one returns and which filters it accepts — so nothing here hard-codes a
 * report type. A new report type on the backend shows up in the UI with no
 * frontend change; `report-catalogue.ts` only supplies presentation extras
 * (icon, ordering) and falls back gracefully for types it hasn't seen.
 */

/** Report type slug, e.g. `transactions`. Open string by design — see above. */
export type ReportTypeId = string;

/** One column of a report, in the order the backend wants it displayed. */
export interface ReportColumn {
  key: string;
  label: string;
}

export interface ReportFilterOption {
  value: string;
  label: string;
}

/** A single-select filter a report type accepts, with its allowed values. */
export interface ReportFilterDef {
  key: string;
  label: string;
  options: ReportFilterOption[];
}

/** An entry in the report catalogue. */
export interface ReportType {
  id: ReportTypeId;
  label: string;
  description: string;
  columns: ReportColumn[];
  filters: ReportFilterDef[];
}

/**
 * Generation is a queued job: `POST /admin/reports` returns `queued`, and the
 * report is polled until it reaches a terminal state. `failed` carries `error`.
 */
export type ReportStatus = "queued" | "running" | "ready" | "failed";

export const TERMINAL_REPORT_STATUSES: ReportStatus[] = ["ready", "failed"];

export function isTerminalReportStatus(status: ReportStatus): boolean {
  return TERMINAL_REPORT_STATUSES.includes(status);
}

/**
 * Only `queued` and `ready` have been observed on the wire. Anything else that
 * isn't `failed` (e.g. `running`, `processing`) is still in flight, so it maps
 * to `running` and keeps the poll going instead of stalling on an unknown value.
 */
export function toReportStatus(value: string): ReportStatus {
  if (value === "queued" || value === "ready" || value === "failed") {
    return value;
  }
  return "running";
}

/** One preview row — keys are backend field names, values arrive untyped. */
export type ReportRow = Record<string, unknown>;

/**
 * Aggregate figures for the window, keyed by the backend (e.g. `credited`,
 * `debited`, `entries` for transactions). Open-keyed: each report type returns
 * whatever totals make sense for it, and the UI renders what it's given.
 */
export type ReportTotals = Record<string, unknown>;

export interface ReportPreviewData {
  /** A capped sample of the result set — the full data is in the download. */
  rows: ReportRow[];
  totals: ReportTotals | null;
  /** Column order for the preview; may differ from the catalogue's list. */
  columns: ReportColumn[];
}

export interface ReportRequester {
  adminId: string | null;
  name: string | null;
}

/** A generated (or generating) report, as returned by the reports endpoints. */
export interface Report {
  id: string;
  type: ReportTypeId;
  /** Human label from the backend — used even for unknown report types. */
  label: string;
  status: ReportStatus;
  /** ISO timestamps covering the requested window (inclusive). */
  dateFrom: string;
  dateTo: string;
  filters: Record<string, string>;
  rowCount: number | null;
  /** True when the result set was capped — the download is capped too. */
  truncated: boolean;
  error: string | null;
  requestedBy: ReportRequester;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  /** Path (not absolute URL) on the API, e.g. `/admin/reports/{id}/download`. */
  downloadUrl: string | null;
  preview: ReportPreviewData | null;
}

/** The date range every report requires. `from`/`to` are `yyyy-mm-dd`. */
export interface DateRange {
  from: string;
  to: string;
}

/**
 * Sentinel used by the filter selects for "no filtering on this key". Stripped
 * out before the request body is built — the API expects the key to be absent.
 */
export const ANY_FILTER_VALUE = "all";

/** What the parameter form collects. `filters` is keyed by `ReportFilterDef.key`. */
export interface ReportParams {
  range: DateRange;
  filters: Record<string, string>;
}

/** Query for the recent-reports list. Empty strings mean "any". */
export interface ReportListFilters {
  type: ReportTypeId | "";
  status: ReportStatus | "";
  /** Only reports the signed-in admin requested. */
  mine: boolean;
}
