import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransactionFinancialReportContent } from "./transaction-financial-report-content";
import { buildGeneratedReport } from "@/features/reports/mock-data";

// Report "generated" mid-September — anchors the reconciliation window.
const GEN_AT = new Date("2026-09-15T00:00:00.000Z").getTime();

function report(params: Parameters<typeof buildGeneratedReport>[1]) {
  return buildGeneratedReport("transaction_financial", params, GEN_AT);
}

describe("TransactionFinancialReportContent", () => {
  test("scenario (a): current-month period renders discrepancy category cards", () => {
    render(
      <TransactionFinancialReportContent
        report={report({
          range: { from: "2026-09-01", to: "2026-09-15" },
          transactionType: "all",
        })}
      />
    );
    expect(screen.getByText(/Reconciliation ran on/i)).toBeInTheDocument();
    expect(screen.getByText("Missing in Anchor")).toBeInTheDocument();
    expect(screen.getByText("Missing in Beevia")).toBeInTheDocument();
    expect(screen.getByText("Amount Mismatch")).toBeInTheDocument();
  });

  test("scenario (b): older period renders the explicit 'not run' state, not zeros", () => {
    render(
      <TransactionFinancialReportContent
        report={report({
          range: { from: "2026-06-01", to: "2026-06-30" },
          transactionType: "all",
        })}
      />
    );
    expect(
      screen.getByText(/No reconciliation was run for this period/i)
    ).toBeInTheDocument();
    expect(screen.queryByText("Missing in Anchor")).toBeNull();
  });

  test("type filter collapses the breakdown table to a single row", () => {
    render(
      <TransactionFinancialReportContent
        report={report({
          range: { from: "2026-09-01", to: "2026-09-15" },
          transactionType: "card_spend",
        })}
      />
    );
    expect(
      screen.getByText(/Filtered to a single transaction type/i)
    ).toBeInTheDocument();
    // one body row → one "Card Spend" label cell
    expect(screen.getAllByText("Card Spend")).toHaveLength(1);
  });
});
