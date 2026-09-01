import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminActivityReportContent } from "./admin-activity-report-content";
import {
  buildAdminActivityReport,
  buildGeneratedReport,
} from "@/features/reports/mock-data";

const GEN_AT = new Date("2026-09-15T00:00:00.000Z").getTime();

function report(params: Parameters<typeof buildGeneratedReport>[1]) {
  return buildGeneratedReport("admin_activity", params, GEN_AT);
}

describe("AdminActivityReportContent", () => {
  test("renders the header count and a paginated first page (15 rows)", () => {
    const params = {
      range: { from: "2026-01-01", to: "2026-12-31" },
      adminActivityType: "all" as const,
    };
    const { totalActions } = buildAdminActivityReport(params, GEN_AT);
    expect(totalActions).toBeGreaterThan(15); // dataset spans multiple pages
    render(<AdminActivityReportContent report={report(params)} />);

    expect(screen.getByText("Total Admin Actions")).toBeInTheDocument();
    expect(
      screen.getByText(`Showing 1–15 of ${totalActions}`)
    ).toBeInTheDocument();
  });

  test("full dataset is paginated (nav present), not capped like DH2's feed", () => {
    const params = {
      range: { from: "2026-01-01", to: "2026-12-31" },
      adminActivityType: "all" as const,
    };
    render(<AdminActivityReportContent report={report(params)} />);
    // pagination nav renders only when there is more than one page
    expect(
      screen.getByRole("navigation", { name: /pagination/i })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /load more/i })).toBeNull();
  });

  test("empty state: zero matching actions shows the explicit message, no rows", () => {
    render(
      <AdminActivityReportContent
        report={report({ range: { from: "2019-01-01", to: "2019-01-31" } })}
      />
    );
    expect(
      screen.getByText("No admin actions found for this period")
    ).toBeInTheDocument();
    expect(screen.queryByText(/^Showing /)).toBeNull();
  });

  test("action-type filter renders only matching description lines", () => {
    render(
      <AdminActivityReportContent
        report={report({
          range: { from: "2026-01-01", to: "2026-12-31" },
          adminActivityType: "admin_invited",
        })}
      />
    );
    const lines = screen.getAllByText(/invited .+ as /);
    expect(lines.length).toBeGreaterThan(0);
    expect(screen.queryByText(/changed .+'s role to /)).toBeNull();
  });
});
