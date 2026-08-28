export type WalletTransactionType =
  | "wallet_funding_bank"
  | "wallet_funding_card"
  | "p2p_send"
  | "p2p_receive"
  | "external_transfer"
  | "card_spend";

export type WalletTransactionStatus =
  | "completed"
  | "pending"
  | "failed"
  | "accepted"
  | "declined"
  | "auto_refunded";

export type WalletTransactionDirection = "credit" | "debit";

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  /** Positive magnitude, in naira. Direction carries the sign for display. */
  amount: number;
  direction: WalletTransactionDirection;
  counterparty: string;
  status: WalletTransactionStatus;
  /** ISO timestamp. */
  timestamp: string;
}

/**
 * Filter state for the transaction list. This shape is intentionally identical
 * to the query params a server-side `/wallet/transactions` endpoint would take,
 * so swapping the mock fetcher in `api.ts` for a real request is a contained
 * change that does not touch the UI.
 */
export interface WalletTransactionFilters {
  /** Empty / undefined means "all types". */
  types?: WalletTransactionType[];
  /** Inclusive lower bound, `yyyy-mm-dd`. */
  dateFrom?: string;
  /** Inclusive upper bound, `yyyy-mm-dd`. */
  dateTo?: string;
}

export interface WalletTransactionsPage {
  transactions: WalletTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
