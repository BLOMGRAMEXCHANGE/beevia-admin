import { describe, expect, test } from "vitest";
import { MOCK_PEOPLE } from "@/features/pending-transfers/mock-data";
import { buildReconciliationRun } from "@/features/reconciliation/mock-data";
import type { ReconciliationParams } from "@/features/reconciliation/types";

// A fixed base so the canonical discrepancy dates (1–10 days back) are stable.
const BASE = new Date("2026-08-27T12:00:00.000Z").getTime();

const WIDE_RANGE: ReconciliationParams = {
  dateFrom: "2026-08-01",
  dateTo: "2026-08-31",
};

describe("buildReconciliationRun — discrepancies found", () => {
  const run = buildReconciliationRun(WIDE_RANGE, BASE);

  test("compares ~100 transactions with a small discrepancy count", () => {
    expect(run.totalCompared).toBe(100);
    expect(run.discrepancies).toHaveLength(5);
    expect(run.matched).toBe(95);
  });

  test("spreads discrepancies across all three categories", () => {
    const byType = run.discrepancies.reduce<Record<string, number>>(
      (acc, d) => ({ ...acc, [d.type]: (acc[d.type] ?? 0) + 1 }),
      {}
    );
    expect(byType.missing_in_anchor).toBe(2);
    expect(byType.missing_in_beevia).toBe(2);
    expect(byType.amount_mismatch).toBe(1);
  });

  test("missing-side rows carry a null amount on the missing side only", () => {
    for (const d of run.discrepancies) {
      if (d.type === "missing_in_anchor") {
        expect(d.anchorAmount).toBeNull();
        expect(d.beeviaAmount).not.toBeNull();
      }
      if (d.type === "missing_in_beevia") {
        expect(d.beeviaAmount).toBeNull();
        expect(d.anchorAmount).not.toBeNull();
      }
      if (d.type === "amount_mismatch") {
        expect(d.beeviaAmount).not.toBeNull();
        expect(d.anchorAmount).not.toBeNull();
        expect(d.beeviaAmount).not.toBe(d.anchorAmount);
      }
    }
  });
});

describe("buildReconciliationRun — zero-discrepancy result", () => {
  test("a user with no discrepancies produces a clean run", () => {
    const run = buildReconciliationRun(
      { ...WIDE_RANGE, user: MOCK_PEOPLE[9].username },
      BASE
    );
    expect(run.discrepancies).toHaveLength(0);
    expect(run.matched).toBe(run.totalCompared);
    expect(run.totalCompared).toBeGreaterThan(0);
  });

  test("a date range that excludes every discrepancy is also clean", () => {
    const run = buildReconciliationRun(
      { dateFrom: "2026-01-01", dateTo: "2026-01-31" },
      BASE
    );
    expect(run.discrepancies).toHaveLength(0);
    expect(run.matched).toBe(run.totalCompared);
  });

  test("scoping to an affected user still surfaces their discrepancy", () => {
    const run = buildReconciliationRun(
      { ...WIDE_RANGE, user: MOCK_PEOPLE[0].username },
      BASE
    );
    expect(run.discrepancies).toHaveLength(1);
    expect(run.discrepancies[0].user.id).toBe(MOCK_PEOPLE[0].id);
  });
});
