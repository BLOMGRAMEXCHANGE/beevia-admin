import { describe, expect, test, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { RecentReports, type RecentReportsProps } from "./recent-reports";
import type { Report, ReportType } from "@/features/reports/types";

const TRANSACTIONS: ReportType = {
  id: "transactions",
  label: "Transactions",
  description: "",
  columns: [],
  filters: [
    {
      key: "status",
      label: "Status",
      options: [{ value: "completed", label: "Completed" }],
    },
  ],
};

// Shaped after a real `GET /admin/reports` list item (no preview).
const READY: Report = {
  id: "53457839-244d-456f-89e8-16e786b2cc5e",
  type: "transactions",
  label: "Transactions",
  status: "ready",
  dateFrom: "2026-09-01T00:00:00.000Z",
  dateTo: "2026-09-30T23:59:59.999Z",
  filters: { status: "completed" },
  rowCount: 23,
  truncated: false,
  error: null,
  requestedBy: {
    adminId: "c8bb10c4-4086-4476-851b-f2d841b2b705",
    name: "Beevia Super Admin",
  },
  createdAt: "2026-09-11T14:32:23.932Z",
  startedAt: "2026-09-11T14:32:23.936Z",
  completedAt: "2026-09-11T14:32:23.948Z",
  downloadUrl: "/admin/reports/53457839-244d-456f-89e8-16e786b2cc5e/download",
  preview: null,
};

const QUEUED: Report = {
  ...READY,
  id: "queued-report",
  status: "queued",
  rowCount: null,
  completedAt: null,
  downloadUrl: null,
};

function renderList(overrides: Partial<RecentReportsProps> = {}) {
  const props: RecentReportsProps = {
    reports: [READY],
    meta: {
      total: 1,
      currentPage: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
    isLoading: false,
    isRefreshing: false,
    error: null,
    onRetry: vi.fn(),
    types: [TRANSACTIONS],
    filters: { type: "", status: "", mine: true },
    onFiltersChange: vi.fn(),
    page: 1,
    onPageChange: vi.fn(),
    onOpen: vi.fn(),
    onDownload: vi.fn(),
    downloadingId: null,
    ...overrides,
  };
  render(<RecentReports {...props} />);
  return props;
}

describe("RecentReports", () => {
  test("empty state for the admin's own reports", () => {
    renderList({ reports: [] });
    expect(
      screen.getByText("You haven't generated any reports yet")
    ).toBeInTheDocument();
  });

  test("filtered empty state offers clearing the filters", () => {
    const props = renderList({
      reports: [],
      filters: { type: "transactions", status: "failed", mine: true },
    });
    expect(
      screen.getByText("No reports match these filters")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Clear filters/ }));
    expect(props.onFiltersChange).toHaveBeenCalledWith({
      type: "",
      status: "",
      mine: true,
    });
  });

  test("shows the window, filter wording and row count", () => {
    renderList();
    expect(
      screen.getByText(/01 Sept? 2026 – 30 Sept? 2026/)
    ).toBeInTheDocument();
    expect(screen.getByText("Status: Completed")).toBeInTheDocument();
    expect(screen.getByText("23 rows")).toBeInTheDocument();
  });

  test("only ready reports can be downloaded from the list", () => {
    const props = renderList({ reports: [READY, QUEUED] });
    const downloads = screen.getAllByRole("button", { name: /Download/ });
    expect(downloads).toHaveLength(1);
    fireEvent.click(downloads[0]);
    expect(props.onDownload).toHaveBeenCalledWith(READY);
    // The download button must not also open the row.
    expect(props.onOpen).not.toHaveBeenCalled();
  });

  test("Open and row click both open the report", () => {
    const props = renderList();
    const row = screen.getByText("Status: Completed").closest("tr")!;
    fireEvent.click(within(row).getByRole("button", { name: "Open" }));
    fireEvent.click(row);
    expect(props.onOpen).toHaveBeenCalledTimes(2);
    expect(props.onOpen).toHaveBeenCalledWith(READY);
  });

  test("requester name only shows on the all-admins tab", () => {
    renderList();
    expect(screen.queryByText("Beevia Super Admin")).toBeNull();
    cleanup();
    renderList({ filters: { type: "", status: "", mine: false } });
    expect(screen.getByText("Beevia Super Admin")).toBeInTheDocument();
  });
});
