import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { SEARCH_PAGE_LIMIT } from "@/features/pending-transfers/constants";
import { buildMockTransfers } from "@/features/pending-transfers/mock-data";
import { decorateTransfers } from "@/features/pending-transfers/overdue";
import type {
  DecoratedTransfer,
  TransferSearchFilters,
  TransferSearchResult,
} from "@/features/pending-transfers/types";

/**
 * MOCK IMPLEMENTATION — no network calls. Everything here stands in for a
 * pending-transfer service that has not been built.
 *
 * Wiring a real backend is contained to the three `fetch*` functions: replace
 * their bodies with requests and map the responses into the same
 * `DecoratedTransfer` / `TransferSearchResult` shapes. `TransferSearchFilters`
 * is already the server param shape, and no component filters, sorts, or
 * paginates on its own.
 */

const OVERDUE_DELAY_MS = 600;
const SEARCH_DELAY_MS = 500;
const DETAIL_DELAY_MS = 450;

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

function matchesUser(transfer: DecoratedTransfer, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [
    transfer.sender.name,
    transfer.sender.username,
    transfer.sender.phone,
    transfer.recipient.name,
    transfer.recipient.username,
    transfer.recipient.phone,
  ].some((field) => field.toLowerCase().includes(needle));
}

async function fetchOverdueTransfers(): Promise<DecoratedTransfer[]> {
  await delay(OVERDUE_DELAY_MS);

  // --- replace from here for a real endpoint ---
  const now = Date.now();
  const decorated = decorateTransfers(buildMockTransfers(now), now);
  return decorated
    .filter((transfer) => transfer.isOverdue)
    .sort((a, b) => (b.msOverdue ?? 0) - (a.msOverdue ?? 0));
  // --- to here ---
}

async function fetchTransferSearch(
  filters: TransferSearchFilters,
  page: number,
  limit: number
): Promise<TransferSearchResult> {
  await delay(SEARCH_DELAY_MS);

  // --- replace from here for a real endpoint ---
  const now = Date.now();
  const decorated = decorateTransfers(buildMockTransfers(now), now);

  const reference = filters.reference?.trim().toLowerCase();

  const matched = decorated
    .filter((transfer) => {
      if (reference && transfer.reference.toLowerCase() !== reference) {
        return false;
      }
      if (filters.user && !matchesUser(transfer, filters.user)) return false;
      if (
        !withinDateRange(transfer.createdAt, filters.dateFrom, filters.dateTo)
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const total = matched.length;
  const start = (Math.max(1, page) - 1) * limit;
  return { transfers: matched.slice(start, start + limit), total };
  // --- to here ---
}

async function fetchTransferDetail(
  reference: string
): Promise<DecoratedTransfer | null> {
  await delay(DETAIL_DELAY_MS);

  // --- replace from here for a real endpoint ---
  const now = Date.now();
  const decorated = decorateTransfers(buildMockTransfers(now), now);
  return (
    decorated.find(
      (transfer) =>
        transfer.reference.toLowerCase() === reference.trim().toLowerCase()
    ) ?? null
  );
  // --- to here ---
}

export function hasActiveFilters(filters: TransferSearchFilters): boolean {
  return Boolean(
    filters.user?.trim() ||
    filters.reference?.trim() ||
    filters.dateFrom ||
    filters.dateTo
  );
}

export function useOverdueTransfers() {
  return useQuery({
    queryKey: ["pending-transfers", "overdue"],
    queryFn: fetchOverdueTransfers,
  });
}

export function useTransferSearch(
  filters: TransferSearchFilters,
  page: number,
  limit: number = SEARCH_PAGE_LIMIT
) {
  return useQuery({
    queryKey: ["pending-transfers", "search", filters, page, limit],
    queryFn: () => fetchTransferSearch(filters, page, limit),
    enabled: hasActiveFilters(filters),
    placeholderData: keepPreviousData,
  });
}

export function useTransferDetail(reference: string) {
  return useQuery({
    queryKey: ["pending-transfers", "detail", reference],
    queryFn: () => fetchTransferDetail(reference),
    enabled: Boolean(reference),
    retry: false,
  });
}
