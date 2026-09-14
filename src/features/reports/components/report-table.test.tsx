import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReportTable } from "./report-table";

describe("ReportTable", () => {
  test("renders an audit row with long details wrapping, not stretching", () => {
    const summary =
      "Changed the role of Ada Obi from Support to Compliance after the quarterly access review";
    render(
      <ReportTable
        columns={[
          { key: "action", label: "Action" },
          { key: "actor", label: "Admin" },
          { key: "summary", label: "Details" },
          { key: "targetId", label: "Target ID" },
        ]}
        rows={[
          {
            action: "role_assignment_changed",
            actor: { admin_id: "c8bb", name: "Beevia Super Admin" },
            summary,
            target_id: "2b1c9f0e-0000-4000-8000-000000000000",
          },
        ]}
        labels={{
          action: { role_assignment_changed: "Role assignment changed" },
        }}
      />
    );
    expect(screen.getByText("Role assignment changed")).toBeInTheDocument();
    expect(screen.getByText("Beevia Super Admin")).toBeInTheDocument();
    expect(screen.getByText(summary)).toHaveClass("whitespace-normal");
    expect(
      screen.getByTitle("2b1c9f0e-0000-4000-8000-000000000000")
    ).toBeInTheDocument();
  });
});
