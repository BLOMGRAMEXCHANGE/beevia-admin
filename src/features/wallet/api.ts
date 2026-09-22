import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { liveClient } from "@/lib/api-client";
import {
  TRANSACTIONS_PAGE_LIMIT,
  WALLETS_PAGE_LIMIT,
} from "@/features/wallet/constants";
import type {
  UserWallets,
  WalletAccount,
  WalletAccountStatus,
  WalletLedgerFilters,
  WalletLedgerPage,
  WalletLedgerTransaction,
  WalletsFilters,
  WalletsSummary,
} from "@/features/wallet/types";

export class WalletApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

function toWalletApiError(error: unknown): WalletApiError {
  if (isAxiosError<{ message?: string }>(error)) {
    return new WalletApiError(
      error.response?.data?.message ?? "Something went wrong.",
      error.response?.status
    );
  }
  return new WalletApiError("Something went wrong.");
}

interface WalletTransactionData {
  id: string;
  date: string;
  type: string;
  direction: "credit" | "debit";
  amount: string;
  balance_after: string;
  status: string;
  reference: string;
  description: string;
  currency: string;
}

interface UserTransactionsResponseData {
  data: {
    user: { id: string; name: string | null };
    transactions: WalletTransactionData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
}

function toWalletLedgerTransaction(
  data: WalletTransactionData
): WalletLedgerTransaction {
  return {
    id: data.id,
    type: data.type,
    direction: data.direction,
    amount: Number(data.amount),
    balanceAfter: Number(data.balance_after),
    status: data.status,
    reference: data.reference,
    description: data.description,
    currency: data.currency,
    timestamp: data.date,
  };
}

/**
 * `GET /admin/transactions/users/{userId}?page=&limit=` — confirmed live.
 * Only `page`/`limit` are confirmed query params; `types`/`dateFrom`/`dateTo`
 * are sent following this codebase's existing convention (see
 * `features/transactions/api.ts`, which hits the sibling platform-wide
 * endpoint) but their accepted names have not been confirmed against this
 * endpoint — if the backend ignores them, results stop narrowing but nothing
 * breaks (pagination stays correct either way).
 */
async function fetchWalletTransactions(
  userId: string,
  filters: WalletLedgerFilters,
  page: number,
  limit: number
): Promise<WalletLedgerPage> {
  try {
    const { data } = await liveClient.get<UserTransactionsResponseData>(
      `/admin/transactions/users/${userId}`,
      {
        params: {
          types: filters.types?.length ? filters.types.join(",") : undefined,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          page,
          limit,
        },
      }
    );
    const { transactions, pagination } = data.data;
    return {
      transactions: transactions.map(toWalletLedgerTransaction),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.total_pages,
      },
    };
  } catch (error) {
    throw toWalletApiError(error);
  }
}

export function useWalletTransactions(
  userId: string,
  filters: WalletLedgerFilters,
  page: number,
  limit: number = TRANSACTIONS_PAGE_LIMIT
) {
  return useQuery({
    queryKey: ["wallet", userId, "transactions", filters, page, limit],
    queryFn: () => fetchWalletTransactions(userId, filters, page, limit),
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });
}

// ---------------------------------------------------------------------------
// Admin wallets module — `GET /admin/wallets` and
// `GET /admin/wallets/users/{userId}`.
// ---------------------------------------------------------------------------

interface WalletAccountData {
  id: string;
  user: { id: string; name: string | null } | null;
  currency: string;
  /** Decimal string, e.g. "19000.00". */
  balance: string;
  status: WalletAccountStatus;
  provider: string | null;
  vba: { account_number: string; bank_name: string } | null;
}

function toWalletAccount(data: WalletAccountData): WalletAccount {
  return {
    id: data.id,
    userId: data.user?.id ?? "",
    userName: data.user?.name ?? null,
    currency: data.currency ?? "NGN",
    balance: Number(data.balance ?? 0),
    status: data.status,
    provider: data.provider ?? null,
    // A VBA with no account number is no VBA — the provider hasn't issued one
    // yet, and rendering an empty account row would read as a real account.
    virtualAccount: data.vba?.account_number
      ? {
          accountNumber: data.vba.account_number,
          bankName: data.vba.bank_name ?? "",
        }
      : null,
  };
}

interface WalletsSummaryData {
  total_wallets: number;
  by_currency:
    | {
        currency: string;
        wallets: number;
        total_balance: string;
      }[]
    | null;
  by_status: Record<string, number> | null;
}

function toWalletsSummary(data: WalletsSummaryData | null): WalletsSummary {
  return {
    totalWallets: data?.total_wallets ?? 0,
    byCurrency: (data?.by_currency ?? []).map((entry) => ({
      currency: entry.currency,
      wallets: entry.wallets ?? 0,
      totalBalance: Number(entry.total_balance ?? 0),
    })),
    byStatus: data?.by_status ?? {},
  };
}

interface WalletsListResponse {
  data: {
    summary: WalletsSummaryData | null;
    wallets: WalletAccountData[] | null;
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
}

export function useWalletsList(
  filters: WalletsFilters,
  page: number,
  limit: number = WALLETS_PAGE_LIMIT
) {
  return useQuery({
    queryKey: ["wallets", "list", filters, page, limit],
    queryFn: async () => {
      try {
        const { data } = await liveClient.get<WalletsListResponse>(
          "/admin/wallets",
          {
            params: {
              page,
              limit,
              search: filters.search,
              currency: filters.currency,
              status: filters.status,
            },
          }
        );
        return {
          summary: toWalletsSummary(data.data.summary),
          wallets: (data.data.wallets ?? []).map(toWalletAccount),
          pagination: {
            page: data.data.pagination.page,
            limit: data.data.pagination.limit,
            total: data.data.pagination.total,
            totalPages: data.data.pagination.total_pages,
          },
        };
      } catch (error) {
        throw toWalletApiError(error);
      }
    },
    placeholderData: keepPreviousData,
  });
}

interface UserWalletsResponse {
  data: {
    user: { id: string; name: string | null } | null;
    wallets: WalletAccountData[] | null;
  };
}

/** Replaces the old balance-from-last-transaction workaround: the balance now
 * comes from the wallet record itself rather than being inferred from the most
 * recent ledger row. */
export function useUserWallets(userId: string) {
  return useQuery({
    queryKey: ["wallets", "user", userId],
    queryFn: async () => {
      try {
        const { data } = await liveClient.get<UserWalletsResponse>(
          `/admin/wallets/users/${userId}`
        );
        const result: UserWallets = {
          user: data.data.user
            ? { id: data.data.user.id, name: data.data.user.name ?? null }
            : null,
          wallets: (data.data.wallets ?? []).map(toWalletAccount),
        };
        return result;
      } catch (error) {
        throw toWalletApiError(error);
      }
    },
    enabled: Boolean(userId),
    retry: false,
  });
}
