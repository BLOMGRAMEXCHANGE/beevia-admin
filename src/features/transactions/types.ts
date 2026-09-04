/**
 * Platform-wide All Transactions list — backed by the live `GET
 * /admin/transactions` endpoint (see `api.ts`). Deliberately NOT the same
 * shape as the per-user Wallet section's mock `WalletTransaction`: the real
 * endpoint's type/status vocabulary and the fields it returns (`reference`,
 * `description`, `currency`, a bare `{id, name}` user) differ from that mock
 * model, so this feature has its own types rather than reusing it.
 */

export type TransactionDirection = "credit" | "debit";

/** The transaction owner. `name` is nullable — the endpoint returns `null` for
 *  some users (seen in the field, cause unconfirmed). */
export interface PlatformTransactionUser {
  id: string;
  name: string | null;
}

/**
 * A single row in the platform-wide All Transactions list.
 *
 * `type` and `status` are typed as open strings, not closed unions: the live
 * endpoint has only confirmed `transfer` / `withdrawal` / `deposit` / `fee`
 * and `completed` so far (see `constants.ts`) and may return other values the
 * UI hasn't seen yet. Badges fall back to `humanizeToken` for anything not in
 * the known label maps, so an unrecognized value still renders instead of
 * breaking.
 */
export interface PlatformTransaction {
  id: string;
  type: string;
  direction: TransactionDirection;
  /** Positive magnitude, in naira. Direction carries the sign for display. */
  amount: number;
  status: string;
  reference: string;
  /** Often empty — not every transaction type carries a description. */
  description: string;
  currency: string;
  /** ISO timestamp. */
  timestamp: string;
  user: PlatformTransactionUser;
}

/**
 * Filter state for the All Transactions list, sent as query params to
 * `GET /admin/transactions`. Only `page`/`limit` are confirmed against the
 * live endpoint today; the rest follow this codebase's existing convention
 * (e.g. `/admin/users`) of sending filter fields through as-named query
 * params, but their exact accepted names have not been confirmed against the
 * transactions endpoint — see the seam comment in `api.ts`.
 */
export interface PlatformTransactionFilters {
  /** Free-text match against the transaction owner. */
  user?: string;
  /** Empty / undefined means "all types". */
  types?: string[];
  /** Empty / undefined means "all statuses". */
  statuses?: string[];
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
