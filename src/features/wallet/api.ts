import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { TRANSACTIONS_PAGE_LIMIT } from "@/features/wallet/constants";
import {
  getMockWalletBalance,
  getMockWalletTransactions,
} from "@/features/wallet/mock-data";
import type {
  WalletTransaction,
  WalletTransactionFilters,
  WalletTransactionsPage,
} from "@/features/wallet/types";

/**
 * MOCK IMPLEMENTATION — no network calls. Everything below is a stand-in for a
 * wallet service that hasn't been built.
 *
 * Swapping to a real, server-paginated/filtered endpoint is contained to the
 * two `fetch*` functions here: replace their bodies with a request whose params
 * are `{ ...filters, page, limit }` and map the response into the same
 * `WalletTransactionsPage` / `number` shapes. The hooks, query keys, and every
 * component stay exactly as they are — `filters` is already the server param
 * shape, and the UI never filters or paginates on its own.
 */

const BALANCE_DELAY_MS = 700;
const TRANSACTIONS_DELAY_MS = 550;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withinDateRange(
  isoTimestamp: string,
  from: string | undefined,
  to: string | undefined
): boolean {
  const time = new Date(isoTimestamp).getTime();
  if (from && time < new Date(`${from}T00:00:00`).getTime()) return false;
  if (to && time > new Date(`${to}T23:59:59.999`).getTime()) return false;
  return true;
}

function applyFilters(
  transactions: WalletTransaction[],
  filters: WalletTransactionFilters
): WalletTransaction[] {
  const typeSet =
    filters.types && filters.types.length > 0 ? new Set(filters.types) : null;

  return transactions.filter((txn) => {
    if (typeSet && !typeSet.has(txn.type)) return false;
    if (!withinDateRange(txn.timestamp, filters.dateFrom, filters.dateTo)) {
      return false;
    }
    return true;
  });
}

async function fetchWalletTransactions(
  userId: string,
  filters: WalletTransactionFilters,
  page: number,
  limit: number
): Promise<WalletTransactionsPage> {
  await delay(TRANSACTIONS_DELAY_MS);

  // --- replace from here for a real endpoint ---
  const filtered = applyFilters(getMockWalletTransactions(userId), filters);
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

async function fetchWalletBalance(userId: string): Promise<number> {
  await delay(BALANCE_DELAY_MS);
  return getMockWalletBalance(userId);
}

export function useWalletBalance(userId: string) {
  return useQuery({
    queryKey: ["wallet", userId, "balance"],
    queryFn: () => fetchWalletBalance(userId),
    enabled: Boolean(userId),
  });
}

export function useWalletTransactions(
  userId: string,
  filters: WalletTransactionFilters,
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
