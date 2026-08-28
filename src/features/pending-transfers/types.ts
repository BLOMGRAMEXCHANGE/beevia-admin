/**
 * Types for the pending accept/decline transfer system (banking sprint).
 *
 * A transfer only lands in this dataset if it went through the pending flow:
 * a free-will send, or a request fulfillment whose amount did not match. An
 * exact-match fulfillment auto-credits instantly and never appears here.
 *
 * There is deliberately no "completed" or "failed" status in this tool — those
 * belong to WO1's general transaction history, a separate view.
 */

export type PendingTransferStatus =
  "pending" | "accepted" | "declined" | "auto_refunded";

export type PendingTransferKind = "free_will_send" | "mismatched_fulfillment";

export type ResolutionMethod =
  "accepted_by_recipient" | "declined_by_recipient" | "auto_refunded_timeout";

export interface TransferParty {
  id: string;
  name: string;
  username: string;
  phone: string;
}

export interface PendingTransfer {
  /** Human-facing reference, also the detail-route segment. */
  reference: string;
  /** Positive magnitude, in naira. */
  amount: number;
  kind: PendingTransferKind;
  sender: TransferParty;
  recipient: TransferParty;
  status: PendingTransferStatus;
  /** ISO timestamp the transfer entered the pending state. */
  createdAt: string;
  /** ISO timestamp it was resolved, or null while still pending. */
  resolvedAt: string | null;
  /** How it resolved, or null while still pending. */
  resolutionMethod: ResolutionMethod | null;
}

/**
 * A transfer decorated with time-based facts computed against a reference
 * "now". Nothing here is stored on the transfer — it is all derived, so the
 * overdue signal in View 1 is a real function of elapsed time.
 */
export interface DecoratedTransfer extends PendingTransfer {
  /** ISO timestamp the 24-hour auto-refund is due to fire. */
  deadlineAt: string;
  /** True only when still pending AND past the 24-hour window. */
  isOverdue: boolean;
  /** ms until the deadline (negative once overdue), or null if resolved. */
  msUntilDeadline: number | null;
  /** ms past the deadline, or null if not overdue. */
  msOverdue: number | null;
}

export interface TransferSearchFilters {
  /** Matches sender/recipient name, username, or phone (case-insensitive). */
  user?: string;
  /** Exact reference match (case-insensitive). */
  reference?: string;
  /** Inclusive lower bound on createdAt, `yyyy-mm-dd`. */
  dateFrom?: string;
  /** Inclusive upper bound on createdAt, `yyyy-mm-dd`. */
  dateTo?: string;
}

export interface TransferSearchResult {
  transfers: DecoratedTransfer[];
  total: number;
}
