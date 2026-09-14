import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReportTotals } from "./report-totals";
import { toTotalsView } from "@/features/reports/presentation";

describe("ReportTotals", () => {
  test("renders headline stats and a breakdown with counts and shares", () => {
    render(
      <ReportTotals
        totals={toTotalsView({
          signups: 20,
          by_verification: { verified: 15, pending: 4, failed: 1 },
        })}
      />
    );
    expect(screen.getByText("Signups")).toBeInTheDocument();
    expect(screen.getByText("By verification")).toBeInTheDocument();
    expect(screen.getByText("20 total")).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("5%")).toBeInTheDocument();
  });

  test("renders nothing when there are no totals", () => {
    const { container } = render(<ReportTotals totals={toTotalsView(null)} />);
    expect(container).toBeEmptyDOMElement();
  });
});
