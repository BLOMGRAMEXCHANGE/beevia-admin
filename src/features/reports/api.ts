import { useMutation, useQuery } from "@tanstack/react-query";
import {
  buildGeneratedReport,
  buildRecentReports,
} from "@/features/reports/mock-data";
import type {
  GeneratedReport,
  RecentReport,
  ReportParams,
  ReportTypeId,
} from "@/features/reports/types";

/**
 * MOCK IMPLEMENTATION — no network calls. Real report generation would be a
 * backend job (query the window, aggregate, build a file), so `generateReport`
 * is a mutation with a deliberate delay rather than resolving instantly.
 *
 * Each function below is a single seam: replace its body with a real request.
 */

const GENERATE_DELAY_MS = 1500;
const HISTORY_DELAY_MS = 400;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateReport(input: {
  typeId: ReportTypeId;
  params: ReportParams;
}): Promise<GeneratedReport> {
  await delay(GENERATE_DELAY_MS);
  // --- replace from here for a real endpoint ---
  return buildGeneratedReport(input.typeId, input.params);
  // --- to here ---
}

async function fetchRecentReports(): Promise<RecentReport[]> {
  await delay(HISTORY_DELAY_MS);
  // --- replace from here for a real endpoint ---
  return buildRecentReports();
  // --- to here ---
}

export function useGenerateReport() {
  return useMutation({ mutationFn: generateReport });
}

export function useRecentReports() {
  return useQuery({
    queryKey: ["reports", "recent"],
    queryFn: fetchRecentReports,
  });
}
