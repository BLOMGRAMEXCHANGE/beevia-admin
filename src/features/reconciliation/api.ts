import { useMutation } from "@tanstack/react-query";
import { buildReconciliationRun } from "@/features/reconciliation/mock-data";
import type {
  ReconciliationParams,
  ReconciliationRun,
} from "@/features/reconciliation/types";

/**
 * MOCK IMPLEMENTATION — no network calls. A real reconciliation run would be a
 * heavier backend job (pull Beevia ledger + Anchor records for the window,
 * diff them), so this is deliberately a mutation with a noticeable delay rather
 * than an instant query.
 *
 * `runReconciliation` is the single seam: replace its body with a request that
 * POSTs `params` and maps the response into `ReconciliationRun`.
 */

const RUN_DELAY_MS = 1900;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runReconciliation(
  params: ReconciliationParams
): Promise<ReconciliationRun> {
  await delay(RUN_DELAY_MS);
  // --- replace from here for a real endpoint ---
  return buildReconciliationRun(params);
  // --- to here ---
}

export function useRunReconciliation() {
  return useMutation({
    mutationFn: runReconciliation,
  });
}
