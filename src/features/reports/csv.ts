import {
  buildAdminActivityReport,
  buildTransactionFinancialStats,
  buildUserKycStats,
} from "@/features/reports/mock-data";
import { DISCREPANCY_LABEL } from "@/features/reconciliation/constants";
import { TRANSACTION_TYPE_LABEL } from "@/features/wallet/constants";
import { presentActivity } from "@/features/dashboard/mock/activity";
import {
  ACCOUNT_TYPE_LABELS,
  ADMIN_ACTIVITY_TYPE_LABELS,
  type GeneratedReport,
} from "@/features/reports/types";

export interface CsvExport {
  filename: string;
  rows: Record<string, string | number>[];
}

/**
 * Client-side CSV export of the User & KYC report's on-screen figures.
 *
 * This is a pure transform of in-memory data — no backend. When the mock
 * `buildUserKycStats` is later swapped for a real API payload, this function
 * keeps working as long as it's handed the same `UserKycStats` shape (derive it
 * from `report` however it arrives, then build the rows below unchanged).
 */
export function buildUserKycCsv(report: GeneratedReport): CsvExport {
  const stats = buildUserKycStats(report.params);
  const { from, to } = report.params.range;

  const rows: Record<string, string | number>[] = [
    { metric: "Report", value: "User & KYC Report" },
    { metric: "Date range", value: `${from} to ${to}` },
    {
      metric: "Account type filter",
      value: ACCOUNT_TYPE_LABELS[stats.accountType],
    },
    { metric: "Generated at", value: report.generatedAt },
    { metric: "Total new signups", value: stats.totalSignups },
    { metric: "Verified", value: stats.verified },
    { metric: "Pending", value: stats.pending },
    { metric: "Failed", value: stats.failed },
  ];

  // Breakdown rows only when not already segmented to one account type.
  if (stats.accountType === "all") {
    rows.push(
      { metric: "New signups - Chat Only", value: stats.breakdown.chatOnly },
      {
        metric: "New signups - Chat + Banking",
        value: stats.breakdown.chatBanking,
      }
    );
  }

  const suffix = stats.accountType === "all" ? "" : `_${stats.accountType}`;
  return { filename: `user-kyc-report_${from}_to_${to}${suffix}.csv`, rows };
}

/**
 * Client-side CSV export of the Transaction & Financial report's on-screen
 * content — header stats, per-type breakdown, and the reconciliation summary
 * section (including which of the two scenarios currently applies).
 *
 * Pure transform of in-memory data — no backend — and unchanged when the mock
 * `buildTransactionFinancialStats` is later swapped for a real payload.
 */
export function buildTransactionFinancialCsv(
  report: GeneratedReport,
  now: number = Date.parse(report.generatedAt)
): CsvExport {
  // Anchor the "current month" reconciliation window to when the report was
  // generated, so the CSV always matches what the preview showed.
  const stats = buildTransactionFinancialStats(report.params, now);
  const { from, to } = report.params.range;
  const typeFilter = stats.transactionType;

  const rows: Record<string, string | number>[] = [
    {
      section: "Summary",
      metric: "Report",
      value: "Transaction & Financial Report",
    },
    { section: "Summary", metric: "Date range", value: `${from} to ${to}` },
    {
      section: "Summary",
      metric: "Transaction type filter",
      value: typeFilter === "all" ? "All" : TRANSACTION_TYPE_LABEL[typeFilter],
    },
    { section: "Summary", metric: "Generated at", value: report.generatedAt },
    {
      section: "Summary",
      metric: "Total transaction volume (NGN)",
      value: stats.totalVolume,
    },
    {
      section: "Summary",
      metric: "Total transaction count",
      value: stats.totalCount,
    },
  ];

  for (const row of stats.breakdown) {
    rows.push({
      section: "Breakdown by type",
      metric: `${row.label} - volume (NGN)`,
      value: row.volume,
    });
    rows.push({
      section: "Breakdown by type",
      metric: `${row.label} - count`,
      value: row.count,
    });
  }

  if (stats.reconciliation.status === "not_run") {
    rows.push({
      section: "Reconciliation discrepancy summary",
      metric: "Status",
      value: "No reconciliation was run for this period",
    });
  } else {
    rows.push({
      section: "Reconciliation discrepancy summary",
      metric: "Status",
      value: `Reconciliation run (${stats.reconciliation.ranAt})`,
    });
    for (const [type, label] of Object.entries(DISCREPANCY_LABEL)) {
      rows.push({
        section: "Reconciliation discrepancy summary",
        metric: label,
        value:
          stats.reconciliation.counts[type as keyof typeof DISCREPANCY_LABEL],
      });
    }
  }

  const suffix = typeFilter === "all" ? "" : `_${typeFilter}`;
  return {
    filename: `transaction-financial-report_${from}_to_${to}${suffix}.csv`,
    rows,
  };
}

/**
 * Client-side CSV export of the Admin Activity / Audit report — the COMPLETE
 * filtered action list (every matching row, not just the visible page), one row
 * per event: action type, description, timestamp.
 *
 * Pure transform of in-memory data — no backend — and unchanged when the mock
 * `buildAdminActivityReport` is later swapped for a real payload.
 */
export function buildAdminActivityCsv(report: GeneratedReport): CsvExport {
  const base = Date.parse(report.generatedAt);
  const { events } = buildAdminActivityReport(report.params, base);
  const { from, to } = report.params.range;
  const typeFilter = report.params.adminActivityType ?? "all";

  const rows: Record<string, string | number>[] = events.map((event) => ({
    action_type: ADMIN_ACTIVITY_TYPE_LABELS[event.type],
    description: presentActivity(event).line,
    timestamp: event.createdAt,
  }));

  // Keep a valid one-column file even when the filtered result is empty, so the
  // export still downloads rather than silently doing nothing.
  if (rows.length === 0) {
    rows.push({
      action_type: "",
      description: "No admin actions found for this period",
      timestamp: "",
    });
  }

  const suffix = typeFilter === "all" ? "" : `_${typeFilter}`;
  return {
    filename: `admin-activity-report_${from}_to_${to}${suffix}.csv`,
    rows,
  };
}
