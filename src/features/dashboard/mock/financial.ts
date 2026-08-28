"use client";

import { useMockResource } from "@/features/dashboard/hooks/use-mock-resource";

export interface FinancialSummary {
  totalBalance: number;
  transactions24h: { count: number; volume: number };
  /** `active` is null when the backend can't (yet) expose card status. */
  cardsIssued: { total: number; active: number | null };
  pendingTransfers: { total: number; overdue: number };
}

export const mockFinancialSummary: FinancialSummary = {
  totalBalance: 4820000,
  transactions24h: { count: 132, volume: 1560000 },
  cardsIssued: { total: 340, active: null }, // active is null — see Card 3
  pendingTransfers: { total: 12, overdue: 1 },
};

const FINANCIAL_SUMMARY_DELAY = 1200;

/**
 * Mock financial summary with a simulated load delay — same pattern as the
 * other dashboard mock hooks. Swapping in a real fetch later means replacing
 * the `useMockResource` call; consumers only read `{ status, data, retry }`.
 */
export function useFinancialSummary() {
  return useMockResource<FinancialSummary>({
    data: mockFinancialSummary,
    delayMs: FINANCIAL_SUMMARY_DELAY,
  });
}
