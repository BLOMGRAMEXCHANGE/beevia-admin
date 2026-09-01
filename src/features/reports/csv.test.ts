import { describe, expect, test } from "vitest";
import {
  buildAdminActivityCsv,
  buildTransactionFinancialCsv,
  buildUserKycCsv,
} from "@/features/reports/csv";
import {
  buildAdminActivityReport,
  buildGeneratedReport,
  buildTransactionFinancialStats,
  buildUserKycStats,
} from "@/features/reports/mock-data";

describe("buildUserKycCsv", () => {
  test("includes the stat figures and breakdown rows for an 'all' report", () => {
    const report = buildGeneratedReport(
      "user_kyc",
      { range: { from: "2026-08-01", to: "2026-08-31" }, accountType: "all" },
      new Date("2026-09-01T00:00:00.000Z").getTime()
    );
    const stats = buildUserKycStats(report.params);
    const { filename, rows } = buildUserKycCsv(report);

    const byMetric = Object.fromEntries(rows.map((r) => [r.metric, r.value]));
    expect(byMetric["Total new signups"]).toBe(stats.totalSignups);
    expect(byMetric["Verified"]).toBe(stats.verified);
    expect(byMetric["Pending"]).toBe(stats.pending);
    expect(byMetric["Failed"]).toBe(stats.failed);
    expect(byMetric["New signups - Chat Only"]).toBe(stats.breakdown.chatOnly);
    expect(byMetric["New signups - Chat + Banking"]).toBe(
      stats.breakdown.chatBanking
    );
    expect(byMetric["Account type filter"]).toBe("All");
    expect(filename).toBe("user-kyc-report_2026-08-01_to_2026-08-31.csv");
  });

  test("omits breakdown rows and tags the filename when segmented", () => {
    const report = buildGeneratedReport("user_kyc", {
      range: { from: "2026-08-01", to: "2026-08-31" },
      accountType: "chat_only",
    });
    const { filename, rows } = buildUserKycCsv(report);

    expect(rows.some((r) => String(r.metric).startsWith("New signups -"))).toBe(
      false
    );
    expect(rows.find((r) => r.metric === "Account type filter")?.value).toBe(
      "Chat Only"
    );
    expect(filename).toBe(
      "user-kyc-report_2026-08-01_to_2026-08-31_chat_only.csv"
    );
  });
});

describe("buildTransactionFinancialCsv", () => {
  const genAt = new Date("2026-09-15T00:00:00.000Z").getTime();

  test("scenario (a): CSV carries the run status and per-category counts", () => {
    const report = buildGeneratedReport(
      "transaction_financial",
      {
        range: { from: "2026-09-01", to: "2026-09-15" },
        transactionType: "all",
      },
      genAt
    );
    const stats = buildTransactionFinancialStats(report.params, genAt);
    const { filename, rows } = buildTransactionFinancialCsv(report);

    const find = (metric: string) =>
      rows.find((r) => r.metric === metric)?.value;
    expect(find("Total transaction volume (NGN)")).toBe(stats.totalVolume);
    expect(find("Total transaction count")).toBe(stats.totalCount);
    expect(String(find("Status"))).toContain("Reconciliation run");
    if (stats.reconciliation.status === "ran") {
      expect(find("Missing in Anchor")).toBe(
        stats.reconciliation.counts.missing_in_anchor
      );
      expect(find("Amount Mismatch")).toBe(
        stats.reconciliation.counts.amount_mismatch
      );
    }
    // all six breakdown types present (volume + count rows)
    expect(rows.filter((r) => r.section === "Breakdown by type")).toHaveLength(
      12
    );
    expect(filename).toBe(
      "transaction-financial-report_2026-09-01_to_2026-09-15.csv"
    );
  });

  test("scenario (b): CSV states no reconciliation ran, with no count rows", () => {
    const report = buildGeneratedReport(
      "transaction_financial",
      {
        range: { from: "2026-06-01", to: "2026-06-30" },
        transactionType: "all",
      },
      genAt
    );
    const { rows } = buildTransactionFinancialCsv(report);
    const reconRows = rows.filter(
      (r) => r.section === "Reconciliation discrepancy summary"
    );
    expect(reconRows).toHaveLength(1);
    expect(reconRows[0].value).toBe(
      "No reconciliation was run for this period"
    );
  });

  test("type filter collapses the breakdown and tags the filename", () => {
    const report = buildGeneratedReport(
      "transaction_financial",
      {
        range: { from: "2026-09-01", to: "2026-09-15" },
        transactionType: "external_transfer",
      },
      genAt
    );
    const { filename, rows } = buildTransactionFinancialCsv(report);
    expect(rows.filter((r) => r.section === "Breakdown by type")).toHaveLength(
      2
    );
    expect(
      rows.find((r) => r.metric === "Transaction type filter")?.value
    ).toBe("External Transfer");
    expect(filename).toBe(
      "transaction-financial-report_2026-09-01_to_2026-09-15_external_transfer.csv"
    );
  });
});

describe("buildAdminActivityCsv", () => {
  const genAt = new Date("2026-09-15T00:00:00.000Z").getTime();
  const wideParams = {
    range: { from: "2026-01-01", to: "2026-12-31" },
    adminActivityType: "all" as const,
  };

  test("exports the COMPLETE filtered list, not just one page", () => {
    const report = buildGeneratedReport("admin_activity", wideParams, genAt);
    const { events } = buildAdminActivityReport(report.params, genAt);
    const { rows, filename } = buildAdminActivityCsv(report);

    expect(events.length).toBeGreaterThan(15); // more than one page
    expect(rows).toHaveLength(events.length);
    expect(Object.keys(rows[0])).toEqual([
      "action_type",
      "description",
      "timestamp",
    ]);
    expect(filename).toBe("admin-activity-report_2026-01-01_to_2026-12-31.csv");
  });

  test("respects the action-type filter (rows + filename)", () => {
    const report = buildGeneratedReport(
      "admin_activity",
      { ...wideParams, adminActivityType: "admin_invited" },
      genAt
    );
    const { rows, filename } = buildAdminActivityCsv(report);
    expect(rows.every((r) => r.action_type === "Admin Invited")).toBe(true);
    expect(filename).toBe(
      "admin-activity-report_2026-01-01_to_2026-12-31_admin_invited.csv"
    );
  });

  test("empty result still yields a downloadable single-row file", () => {
    const report = buildGeneratedReport(
      "admin_activity",
      { range: { from: "2019-01-01", to: "2019-01-31" } },
      genAt
    );
    const { rows } = buildAdminActivityCsv(report);
    expect(rows).toHaveLength(1);
    expect(rows[0].description).toBe("No admin actions found for this period");
  });
});
