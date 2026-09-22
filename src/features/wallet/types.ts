import type { TransactionDirection } from "@/features/transactions/types";

/**
 * NOTE: everything below this line is the legacy mock wallet vocabulary —
 * it is no longer what the live per-user Wallet tab uses. The Wallet tab now
 * talks to the real `GET /admin/transactions/users/{id}` endpoint, whose
 * type/status vocabulary matches the platform-wide `/admin/transactions`
 * endpoint instead (see `WalletLedgerTransaction` below, and
 * `features/transactions/types.ts`). Do not repurpose these for real wallet
 * data.
 */
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

// ---------------------------------------------------------------------------
// Live per-user ledger — backs the real Wallet tab (`GET
// /admin/transactions/users/{id}`). Deliberately separate from
// `WalletTransaction` above: `type`/`status` are open strings (same reasoning
// as `PlatformTransaction` in `features/transactions/types.ts` — the live
// vocabulary doesn't match the closed mock union), and there's no `user` field
// since this list is already scoped to one user.
// ---------------------------------------------------------------------------

export interface WalletLedgerTransaction {
  id: string;
  type: string;
  direction: TransactionDirection;
  /** Positive magnitude, in naira. Direction carries the sign for display. */
  amount: number;
  /** Wallet balance immediately after this transaction, in naira. */
  balanceAfter: number;
  status: string;
  reference: string;
  /** Often empty — not every transaction type carries a description. */
  description: string;
  currency: string;
  /** ISO timestamp. */
  timestamp: string;
}

export interface WalletLedgerFilters {
  /** Empty / undefined means "all types". */
  types?: string[];
  /** Inclusive lower bound, `yyyy-mm-dd`. */
  dateFrom?: string;
  /** Inclusive upper bound, `yyyy-mm-dd`. */
  dateTo?: string;
}

export interface WalletLedgerPage {
  transactions: WalletLedgerTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ---------------------------------------------------------------------------
// Admin wallets module — `GET /admin/wallets` and
// `GET /admin/wallets/users/{userId}`. A wallet account is the record itself,
// distinct from the user-level `WalletStatus` in `types/user.ts` which
// describes whether a user has a wallet at all.
// ---------------------------------------------------------------------------

export type WalletAccountStatus = "active" | "locked" | "frozen" | "closed";

/** The virtual bank account funds are paid into. Not every wallet has one. */
export interface WalletVirtualAccount {
  accountNumber: string;
  bankName: string;
}

export interface WalletAccount {
  id: string;
  userId: string;
  userName: string | null;
  currency: string;
  /** Major units (naira, not kobo) — the API sends a decimal string. */
  balance: number;
  status: WalletAccountStatus;
  provider: string | null;
  virtualAccount: WalletVirtualAccount | null;
}

export interface WalletCurrencyTotal {
  currency: string;
  wallets: number;
  totalBalance: number;
}

export interface WalletsSummary {
  totalWallets: number;
  byCurrency: WalletCurrencyTotal[];
  /** Open-ended: the API only returns statuses that actually have wallets. */
  byStatus: Record<string, number>;
}

export interface WalletsFilters {
  search?: string;
  currency?: string;
  status?: WalletAccountStatus;
}

export interface UserWallets {
  user: { id: string; name: string | null } | null;
  wallets: WalletAccount[];
}
