import { MOCK_PEOPLE } from "@/features/pending-transfers/mock-data";
import type {
  ReconciliationDiscrepancy,
  ReconciliationParams,
  ReconciliationRun,
} from "@/features/reconciliation/types";

/**
 * MOCK DATA ONLY — stands in for an Anchor reconciliation/reporting endpoint
 * that has not been confirmed to exist. `api.ts` is the single seam where a
 * real run would be wired in.
 *
 * The comparison model here (three discrepancy categories, Beivia vs Anchor
 * amounts) is a standard shape, not a finalized spec — revisit once Anchor's
 * real capability is known.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function isoDaysAgo(days: number, base: number): string {
  return new Date(base - days * DAY_MS).toISOString();
}

/**
 * The canonical discrepancy set for a full (unscoped) run: 2 Missing in Anchor,
 * 2 Missing in Beevia, 1 Amount Mismatch — a realistic small rate against ~100
 * compared transactions. Built relative to `base` so the dates land inside a
 * typical "this month" window.
 */
function canonicalDiscrepancies(base: number): ReconciliationDiscrepancy[] {
  return [
    {
      id: "rec-d1",
      type: "missing_in_anchor",
      reference: "TRF-4A19C7",
      user: MOCK_PEOPLE[0],
      beeviaAmount: 45000,
      anchorAmount: null,
      date: isoDaysAgo(1, base),
    },
    {
      id: "rec-d2",
      type: "missing_in_anchor",
      reference: "TRF-9E02B3",
      user: MOCK_PEOPLE[1],
      beeviaAmount: 12250,
      anchorAmount: null,
      date: isoDaysAgo(3, base),
    },
    {
      id: "rec-d3",
      type: "missing_in_beevia",
      reference: "ANC-77F1A0",
      user: MOCK_PEOPLE[2],
      beeviaAmount: null,
      anchorAmount: 150000,
      date: isoDaysAgo(5, base),
    },
    {
      id: "rec-d4",
      type: "missing_in_beevia",
      reference: "ANC-2C88D5",
      user: MOCK_PEOPLE[3],
      beeviaAmount: null,
      anchorAmount: 8000,
      date: isoDaysAgo(7, base),
    },
    {
      id: "rec-d5",
      type: "amount_mismatch",
      reference: "TRF-63BE41",
      user: MOCK_PEOPLE[4],
      beeviaAmount: 30000,
      anchorAmount: 27000,
      date: isoDaysAgo(10, base),
    },
  ];
}

function withinRange(iso: string, from: string, to: string): boolean {
  const time = new Date(iso).getTime();
  if (time < new Date(`${from}T00:00:00`).getTime()) return false;
  if (time > new Date(`${to}T23:59:59.999`).getTime()) return false;
  return true;
}

function matchesUser(
  discrepancy: ReconciliationDiscrepancy,
  query: string
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [
    discrepancy.user.name,
    discrepancy.user.username,
    discrepancy.user.phone,
  ].some((field) => field.toLowerCase().includes(needle));
}

/**
 * Deterministic reconciliation run for the given params.
 *
 * - Unscoped: ~100 compared, 5 discrepancies (the canonical set that falls in
 *   range).
 * - Scoped to a user with no discrepancies (or a date range that excludes them
 *   all): a clean run with zero discrepancies — the calm positive state.
 */
export function buildReconciliationRun(
  params: ReconciliationParams,
  base: number = Date.now()
): ReconciliationRun {
  const discrepancies = canonicalDiscrepancies(base).filter(
    (discrepancy) =>
      withinRange(discrepancy.date, params.dateFrom, params.dateTo) &&
      (!params.user || matchesUser(discrepancy, params.user))
  );

  const totalCompared = params.user
    ? 6 + (hashString(params.user.trim().toLowerCase()) % 15)
    : 100;
  const matched = Math.max(0, totalCompared - discrepancies.length);

  return {
    params,
    ranAt: new Date(base).toISOString(),
    totalCompared,
    matched,
    discrepancies,
  };
}
