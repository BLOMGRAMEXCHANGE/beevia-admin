import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getMockPlatformTransactions } from "@/features/transactions/mock-data";
import type {
  PlatformTransaction,
  PlatformTransactionFilters,
  PlatformTransactionsPage,
} from "@/features/transactions/types";

/**
 * MOCK IMPLEMENTATION — no network calls. `fetchPlatformTransactions` is the
 * single seam: replace its body with a request whose params are
 * `{ ...filters, page, limit }` and map the response into
 * `PlatformTransactionsPage`. The hook, query key, and every component stay as
 * they are — `filters` is already the server param shape and the UI never
 * filters or paginates on its own.
 */

export const ALL_TRANSACTIONS_PAGE_LIMIT = 15;

const FETCH_DELAY_MS = 550;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withinDateRange(
  iso: string,
  from: string | undefined,
  to: string | undefined
): boolean {
  const time = new Date(iso).getTime();
  if (from && time < new Date(`${from}T00:00:00`).getTime()) return false;
  if (to && time > new Date(`${to}T23:59:59.999`).getTime()) return false;
  return true;
}

function matchesUser(transaction: PlatformTransaction, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [
    transaction.user.name,
    transaction.user.username,
    transaction.user.phone,
  ].some((field) => field.toLowerCase().includes(needle));
}

function applyFilters(
  transactions: PlatformTransaction[],
  filters: PlatformTransactionFilters
): PlatformTransaction[] {
  const typeSet =
    filters.types && filters.types.length > 0 ? new Set(filters.types) : null;
  const statusSet =
    filters.statuses && filters.statuses.length > 0
      ? new Set(filters.statuses)
      : null;

  return transactions.filter((transaction) => {
    if (typeSet && !typeSet.has(transaction.type)) return false;
    if (statusSet && !statusSet.has(transaction.status)) return false;
    if (filters.user && !matchesUser(transaction, filters.user)) return false;
    if (
      !withinDateRange(transaction.timestamp, filters.dateFrom, filters.dateTo)
    ) {
      return false;
    }
    return true;
  });
}

async function fetchPlatformTransactions(
  filters: PlatformTransactionFilters,
  page: number,
  limit: number
): Promise<PlatformTransactionsPage> {
  await delay(FETCH_DELAY_MS);

  // --- replace from here for a real endpoint ---
  const filtered = applyFilters(getMockPlatformTransactions(), filters);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  const transactions = filtered.slice(start, start + limit);
  // --- to here ---

  return {
    transactions,
    pagination: { page: safePage, limit, total, totalPages },
  };
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
