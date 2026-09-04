import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { liveClient } from "@/lib/api-client";
import { TRANSACTIONS_PAGE_LIMIT } from "@/features/wallet/constants";
import type {
  WalletLedgerFilters,
  WalletLedgerPage,
  WalletLedgerTransaction,
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

/**
 * There's no dedicated balance endpoint yet. Every transaction row carries
 * `balance_after`, so the most recent row's `balance_after` IS the current
 * balance — this fetches just that one row (unfiltered, page 1, limit 1)
 * instead of standing up separate mock data. Swap for a real
 * `/admin/wallets/{userId}` call if/when one exists.
 */
export function useWalletBalance(userId: string) {
  return useQuery({
    queryKey: ["wallet", userId, "balance"],
    queryFn: async () => {
      const page = await fetchWalletTransactions(userId, {}, 1, 1);
      return page.transactions[0]?.balanceAfter ?? 0;
    },
    enabled: Boolean(userId),
  });
}
