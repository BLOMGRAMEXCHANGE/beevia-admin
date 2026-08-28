import type { TransferParty } from "@/features/pending-transfers/types";

/**
 * The three ways a Beevia ledger record and an Anchor record can fail to agree.
 *
 * NOTE: this comparison model is a reasonable standard three-way reconciliation
 * shape. It is NOT a finalized spec — it must be revisited once it is confirmed
 * what Anchor's API actually exposes for reconciliation/reporting.
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
