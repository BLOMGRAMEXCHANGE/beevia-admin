import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { liveClient } from "@/lib/api-client";
import { TRANSACTIONS_PAGE_LIMIT } from "@/features/transactions/constants";
import type {
  PlatformTransaction,
  PlatformTransactionFilters,
  PlatformTransactionsPage,
} from "@/features/transactions/types";

export const ALL_TRANSACTIONS_PAGE_LIMIT = TRANSACTIONS_PAGE_LIMIT;

export class TransactionsApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

function toTransactionsApiError(error: unknown): TransactionsApiError {
  if (isAxiosError<{ message?: string }>(error)) {
    return new TransactionsApiError(
      error.response?.data?.message ?? "Something went wrong.",
      error.response?.status
    );
  }
  return new TransactionsApiError("Something went wrong.");
}

interface PlatformTransactionData {
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
  user: { id: string; name: string | null };
}

interface PlatformTransactionsResponseData {
  data: {
    transactions: PlatformTransactionData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
}

function toPlatformTransaction(
  data: PlatformTransactionData
): PlatformTransaction {
  return {
    id: data.id,
    type: data.type,
    direction: data.direction,
    amount: Number(data.amount),
    status: data.status,
    reference: data.reference,
    description: data.description,
    currency: data.currency,
    timestamp: data.date,
    user: data.user,
  };
}

/**
 * `GET /admin/transactions?page=&limit=` — confirmed live. Only `page` and
 * `limit` are confirmed query params; `user`/`types`/`statuses`/`dateFrom`/
 * `dateTo` are sent following this codebase's existing convention (see
 * `/admin/users` in `features/users/api.ts`) but their accepted names have NOT
 * been confirmed against this endpoint — if the backend ignores them, results
 * stop narrowing but nothing breaks (pagination stays correct either way).
 * Revisit once the backend documents its actual filter params.
 */
async function fetchPlatformTransactions(
  filters: PlatformTransactionFilters,
  page: number,
  limit: number
): Promise<PlatformTransactionsPage> {
  try {
    const { data } = await liveClient.get<PlatformTransactionsResponseData>(
      "/admin/transactions",
      {
        params: {
          user: filters.user || undefined,
          types: filters.types?.length ? filters.types.join(",") : undefined,
          statuses: filters.statuses?.length
            ? filters.statuses.join(",")
            : undefined,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          page,
          limit,
        },
      }
    );
    const { transactions, pagination } = data.data;
    return {
      transactions: transactions.map(toPlatformTransaction),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.total_pages,
      },
    };
  } catch (error) {
    throw toTransactionsApiError(error);
  }
}

export function useAllTransactions(
  filters: PlatformTransactionFilters,
  page: number,
  limit: number = ALL_TRANSACTIONS_PAGE_LIMIT
) {
  return useQuery({
    queryKey: ["transactions", "all", filters, page, limit],
    queryFn: () => fetchPlatformTransactions(filters, page, limit),
    placeholderData: keepPreviousData,
  });
}
