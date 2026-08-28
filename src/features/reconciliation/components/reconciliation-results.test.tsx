import { afterEach, describe, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

afterEach(cleanup);

import { ReconciliationResults } from "@/features/reconciliation/components/reconciliation-results";
import { buildReconciliationRun } from "@/features/reconciliation/mock-data";
import { MOCK_PEOPLE } from "@/features/pending-transfers/mock-data";

const BASE = new Date("2026-08-27T12:00:00.000Z").getTime();
const RANGE = { dateFrom: "2026-08-01", dateTo: "2026-08-31" };

describe("ReconciliationResults — discrepancies found", () => {
  test("shows the summary counts and a row per discrepancy", () => {
    const run = buildReconciliationRun(RANGE, BASE);
    render(<ReconciliationResults run={run} />);

    expect(screen.getByText("Total Compared")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("95")).toBeInTheDocument();

    expect(screen.getByText("2 Missing in Anchor")).toBeInTheDocument();
    expect(screen.getByText("2 Missing in Beevia")).toBeInTheDocument();
    expect(screen.getByText("1 Amount Mismatch")).toBeInTheDocument();

    // one discrepancy reference from the canonical set
    expect(screen.getByText("TRF-4A19C7")).toBeInTheDocument();
    // a "missing in Anchor" row shows a dash for the Anchor amount
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(
      screen.queryByText(/No discrepancies found/)
    ).not.toBeInTheDocument();
  });
});

describe("ReconciliationResults — zero-discrepancy result", () => {
  test("shows the calm positive state, not an empty list", () => {
    const run = buildReconciliationRun(
      { ...RANGE, user: MOCK_PEOPLE[9].username },
      BASE
    );
    render(<ReconciliationResults run={run} />);

    expect(screen.getByText("No discrepancies found")).toBeInTheDocument();
    expect(
      screen.getByText(/Beevia and Anchor records match for this period/)
    ).toBeInTheDocument();
    expect(screen.queryByText("Discrepancies")).not.toBeInTheDocument();
  });
});
