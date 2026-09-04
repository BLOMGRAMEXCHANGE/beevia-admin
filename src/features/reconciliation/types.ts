import type { TransferParty } from "@/features/pending-transfers/types";

/**
 * NOTE: everything below this line (through `ReconciliationRun`) is the mock
 * comparison model the Transaction & Financial report's mock generator
 * (`features/reports`) is built against — it is no longer what the live
 * Reconciliation tab / per-user reconciliation check use. Those now talk to
 * the real `GET /admin/reconciliation/pool` and
 * `GET /admin/reconciliation/users/{id}` endpoints (see `PoolReconciliation`
 * and `UserReconciliation` further down). Left as-is so the still-mock report
 * keeps working; do not repurpose these for real reconciliation data.
 *
 * The three ways a Beevia ledger record and an Anchor record can fail to agree.
 */
export type DiscrepancyType =
  "missing_in_anchor" | "missing_in_beevia" | "amount_mismatch";

export interface ReconciliationDiscrepancy {
  id: string;
  type: DiscrepancyType;
  /** Transaction reference / ID shared (or expected to be shared) by both systems. */
  reference: string;
  user: TransferParty;
  /** Beevia-recorded amount in naira, or null when missing in Beevia. */
  beeviaAmount: number | null;
  /** Anchor-recorded amount in naira, or null when missing in Anchor. */
  anchorAmount: number | null;
  /** ISO timestamp of the transaction. */
  date: string;
}

export interface ReconciliationParams {
  /** Inclusive lower bound, `yyyy-mm-dd`. */
  dateFrom: string;
  /** Inclusive upper bound, `yyyy-mm-dd`. */
  dateTo: string;
  /** Optional scope to a single user (name / username / phone match). */
  user?: string;
}

export interface ReconciliationRun {
  params: ReconciliationParams;
  ranAt: string;
  totalCompared: number;
  matched: number;
  discrepancies: ReconciliationDiscrepancy[];
}

// ---------------------------------------------------------------------------
// Live Anchor reconciliation — `GET /admin/reconciliation/users/{id}` and
// `GET /admin/reconciliation/pool`. Deliberately separate from the mock model
// above: the real per-user comparison only has visibility into one side of an
// unmatched record (Anchor's side, for `in_anchor_not_beevia`; presumably
// Beevia's side for `in_beevia_not_anchor`, unconfirmed — see
// `ReconciliationLineItem`), not a symmetric beevia-amount/anchor-amount pair
// for every row the way the mock model assumed.
// ---------------------------------------------------------------------------

export type ReconciliationBucketKey =
  "amount_mismatch" | "in_beevia_not_anchor" | "in_anchor_not_beevia";

/**
 * One row inside a reconciliation bucket. Only `in_anchor_not_beevia` has a
 * confirmed shape (anchor-side transaction fields); `in_beevia_not_anchor` and
 * `amount_mismatch` are unconfirmed (empty in the sample response) — fields
 * are nullable/optional throughout so an unexpected or partial shape from the
 * backend still renders instead of crashing.
 */
export interface ReconciliationLineItem {
  /** Best-effort id: whichever of anchor_txn_id / beevia_txn_id / id was present. */
  id: string;
  /** e.g. "payout", "deposit" — open vocabulary. */
  kind: string | null;
  /** Single-sided amount (most rows). Null when only dual amounts are present. */
  amount: number | null;
  /** Set only for a genuine two-sided mismatch, if the backend sends both. */
  anchorAmount: number | null;
  beeviaAmount: number | null;
  direction: string | null;
  /** provider_ref / reference — Anchor's transfer/payment id. */
  reference: string | null;
  summary: string;
  /** Timestamp as returned — not guaranteed to carry a timezone suffix. */
  date: string | null;
}

export interface UserReconciliation {
  user: { id: string; name: string | null };
  anchorAccountId: string;
  /** Open string — "matched" / "discrepancies" confirmed, others may exist. */
  status: string;
  generatedAt: string;
  summary: {
    matched: number;
    amountMismatch: number;
    inBeeviaNotAnchor: number;
    inAnchorNotBeevia: number;
    /** Naira. */
    beeviaBalance: number;
    /** Naira. */
    anchorBalance: number;
    balanceMatches: boolean;
  };
  buckets: Record<ReconciliationBucketKey, ReconciliationLineItem[]>;
  notes: string[];
}

export interface PoolReconciliation {
  /** Open string — "solvent" confirmed, others (e.g. "insolvent") may exist. */
  status: string;
  poolAccountId: string;
  generatedAt: string;
  /** Naira — total the ledger says is owed across all user wallets. */
  ledgerLiability: number;
  /** Naira — Anchor pool account's actual balance. */
  poolBalance: number;
  /** Naira — poolBalance minus ledgerLiability, sign as returned by the API. */
  difference: number;
  solvent: boolean;
  balanceMatches: boolean;
  userWalletCount: number;
  notes: string[];
}
