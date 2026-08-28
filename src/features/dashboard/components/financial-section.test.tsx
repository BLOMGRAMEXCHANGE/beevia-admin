import { afterEach, describe, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

afterEach(cleanup);
import {
  PendingTransfersCard,
  VirtualCardsCard,
} from "@/features/dashboard/components/financial-section";
import { mockFinancialSummary } from "@/features/dashboard/mock/financial";

describe("VirtualCardsCard — Card 3 label paths", () => {
  test("active is null → falls back to total issued", () => {
    render(<VirtualCardsCard data={mockFinancialSummary} />);
    expect(screen.getByText("Total Virtual Cards Issued")).toBeInTheDocument();
    expect(screen.getByText("340")).toBeInTheDocument();
  });

  test("active is a number → shows active count", () => {
    render(
      <VirtualCardsCard
        data={{
          ...mockFinancialSummary,
          cardsIssued: { total: 340, active: 275 },
        }}
      />
    );
    expect(screen.getByText("Active Virtual Cards")).toBeInTheDocument();
    expect(screen.getByText("275")).toBeInTheDocument();
    expect(screen.getByText("of 340 issued")).toBeInTheDocument();
  });
});

describe("PendingTransfersCard — Card 4 flagged vs normal", () => {
  test("overdue > 0 → flagged, calls out overdue count", () => {
    render(<PendingTransfersCard data={mockFinancialSummary} />);
    expect(screen.getByText(/12 pending/)).toBeInTheDocument();
    expect(screen.getByText("1 overdue")).toBeInTheDocument();
  });

  test("overdue === 0 → normal state, no overdue callout", () => {
    render(
      <PendingTransfersCard
        data={{
          ...mockFinancialSummary,
          pendingTransfers: { total: 12, overdue: 0 },
        }}
      />
    );
    expect(screen.getByText("12 pending")).toBeInTheDocument();
    expect(screen.queryByText(/overdue/)).not.toBeInTheDocument();
  });
});
