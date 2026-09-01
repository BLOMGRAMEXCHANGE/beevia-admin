import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentReports } from "./recent-reports";
import { buildRecentReports } from "@/features/reports/mock-data";

const BASE = new Date("2026-09-01T12:00:00.000Z").getTime();

describe("RecentReports", () => {
  test("empty state: renders guidance and no report rows", () => {
    render(<RecentReports reports={[]} isLoading={false} onReopen={vi.fn()} />);
    expect(screen.getByText("No reports generated yet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reopen" })).toBeNull();
  });

  test("empty state also shows when reports is undefined", () => {
    render(
      <RecentReports reports={undefined} isLoading={false} onReopen={vi.fn()} />
    );
    expect(screen.getByText("No reports generated yet")).toBeInTheDocument();
  });

  test("populated state: renders a Reopen action per entry", () => {
    const rows = buildRecentReports(BASE);
    render(
      <RecentReports reports={rows} isLoading={false} onReopen={vi.fn()} />
    );
    expect(screen.queryByText("No reports generated yet")).toBeNull();
    expect(screen.getAllByRole("button", { name: "Reopen" })).toHaveLength(
      rows.length
    );
  });
});
