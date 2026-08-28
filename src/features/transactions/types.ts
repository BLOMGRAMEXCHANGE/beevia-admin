import type { TransferParty } from "@/features/pending-transfers/types";
import type {
  WalletTransaction,
  WalletTransactionStatus,
  WalletTransactionType,
} from "@/features/wallet/types";

/**
 * A single row in the platform-wide All Transactions list. Deliberately the
 * exact same shape as the per-user Wallet section's `WalletTransaction`, with
 * one field added — `user` — since this view spans every customer instead of
 * one.
 */
export interface PlatformTransaction extends WalletTransaction {
  user: TransferParty;
}

/**
 * Filter state for the All Transactions list. This shape mirrors the query
 * params a real `/admin/transactions` endpoint would take, so swapping the
 * client-side mock filter in `api.ts` for a server-side request is a contained
 * change that does not touch the UI.
 */
export interface PlatformTransactionFilters {
  /** Matches user name, username, or phone (case-insensitive). */
  user?: string;
  /** Empty / undefined means "all types". */
  types?: WalletTransactionType[];
  /** Empty / undefined means "all statuses". */
  statuses?: WalletTransactionStatus[];
  /** Inclusive lower bound on timestamp, `yyyy-mm-dd`. */
  dateFrom?: string;
  /** Inclusive upper bound on timestamp, `yyyy-mm-dd`. */
  dateTo?: string;
}

export interface PlatformTransactionsPage {
  transactions: PlatformTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
