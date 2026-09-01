import { describe, expect, test } from "vitest";
import { REPORT_TYPES } from "@/features/reports/report-types";
import {
  buildAdminActivityDataset,
  buildAdminActivityReport,
  buildGeneratedReport,
  buildRecentReports,
  buildTransactionFinancialStats,
  buildUserKycStats,
  periodHasReconciliationRun,
} from "@/features/reports/mock-data";
import type { ReportParams } from "@/features/reports/types";

const BASE = new Date("2026-09-01T12:00:00.000Z").getTime();

describe("buildRecentReports", () => {
  const rows = buildRecentReports(BASE);

  test("returns 6–8 entries with unique ids", () => {
    expect(rows.length).toBeGreaterThanOrEqual(6);
    expect(rows.length).toBeLessThanOrEqual(8);
    expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length);
  });

  test("spans all three report types", () => {
    const types = new Set(rows.map((row) => row.typeId));
    for (const type of REPORT_TYPES) {
      expect(types.has(type.id)).toBe(true);
    }
  });

  test("every row carries a valid date range and a generated timestamp", () => {
    for (const row of rows) {
      expect(row.params.range.from <= row.params.range.to).toBe(true);
      expect(Number.isNaN(Date.parse(row.generatedAt))).toBe(false);
    }
  });
});

describe("buildUserKycStats", () => {
  const wide: ReportParams = {
    range: { from: "2026-08-01", to: "2026-08-31" },
    accountType: "all",
  };
  const narrow: ReportParams = {
    range: { from: "2026-08-01", to: "2026-08-03" },
    accountType: "all",
  };

  test("verified + pending + failed always equals total signups", () => {
    for (const params of [wide, narrow]) {
      const s = buildUserKycStats(params);
      expect(s.verified + s.pending + s.failed).toBe(s.totalSignups);
    }
  });

  test("breakdown sums to total signups", () => {
    const s = buildUserKycStats(wide);
    expect(s.breakdown.chatOnly + s.breakdown.chatBanking).toBe(s.totalSignups);
  });

  test("a wider date range yields more signups than a narrow one", () => {
    expect(buildUserKycStats(wide).totalSignups).toBeGreaterThan(
      buildUserKycStats(narrow).totalSignups
    );
  });

  test("a specific account-type filter shrinks the total vs 'all'", () => {
    const all = buildUserKycStats(wide).totalSignups;
    const chatOnly = buildUserKycStats({
      ...wide,
      accountType: "chat_only",
    }).totalSignups;
    expect(chatOnly).toBeLessThan(all);
    expect(chatOnly).toBeGreaterThan(0);
  });

  test("a specific segment puts the whole total in that segment", () => {
    const s = buildUserKycStats({ ...wide, accountType: "chat_banking" });
    expect(s.breakdown.chatOnly).toBe(0);
    expect(s.breakdown.chatBanking).toBe(s.totalSignups);
  });

  test("an inverted / empty range produces graceful zeros", () => {
    const s = buildUserKycStats({
      range: { from: "2026-08-31", to: "2026-08-01" },
    });
    expect(s.totalSignups).toBe(0);
    expect(s.verified).toBe(0);
    expect(s.pending).toBe(0);
    expect(s.failed).toBe(0);
    expect(s.breakdown.chatOnly).toBe(0);
    expect(s.breakdown.chatBanking).toBe(0);
  });

  test("is deterministic for the same params", () => {
    expect(buildUserKycStats(wide)).toEqual(buildUserKycStats(wide));
  });
});

describe("buildTransactionFinancialStats", () => {
  // Fixed "now" in mid-September so the current-month reconciliation window
  // is deterministic.
  const NOW = new Date("2026-09-15T12:00:00.000Z").getTime();

  const septWide: ReportParams = {
    range: { from: "2026-09-01", to: "2026-09-15" },
    transactionType: "all",
  };
  const septNarrow: ReportParams = {
    range: { from: "2026-09-01", to: "2026-09-03" },
    transactionType: "all",
  };
  const oldPeriod: ReportParams = {
    range: { from: "2026-06-01", to: "2026-06-30" },
    transactionType: "all",
  };

  test("totals equal the sum of the breakdown rows", () => {
    const s = buildTransactionFinancialStats(septWide, NOW);
    expect(s.breakdown).toHaveLength(6);
    expect(s.breakdown.reduce((n, r) => n + r.volume, 0)).toBe(s.totalVolume);
    expect(s.breakdown.reduce((n, r) => n + r.count, 0)).toBe(s.totalCount);
  });

  test("a wider range yields more volume and count than a narrow one", () => {
    const wide = buildTransactionFinancialStats(septWide, NOW);
    const narrow = buildTransactionFinancialStats(septNarrow, NOW);
    expect(wide.totalCount).toBeGreaterThan(narrow.totalCount);
    expect(wide.totalVolume).toBeGreaterThan(narrow.totalVolume);
  });

  test("a transaction-type filter collapses the breakdown to that one row", () => {
    const s = buildTransactionFinancialStats(
      { ...septWide, transactionType: "card_spend" },
      NOW
    );
    expect(s.breakdown).toHaveLength(1);
    expect(s.breakdown[0].type).toBe("card_spend");
    expect(s.totalCount).toBe(s.breakdown[0].count);
    expect(s.totalVolume).toBe(s.breakdown[0].volume);
  });

  test("scenario (a): a period in the current month shows a real run with a small discrepancy count", () => {
    const s = buildTransactionFinancialStats(septWide, NOW);
    expect(s.reconciliation.status).toBe("ran");
    if (s.reconciliation.status !== "ran") return;
    const { counts } = s.reconciliation;
    const total =
      counts.missing_in_anchor +
      counts.missing_in_beevia +
      counts.amount_mismatch;
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThan(15); // small, realistic rate
  });

  test("scenario (b): an older period shows an explicit 'not run' state (never fabricated zeros)", () => {
    const s = buildTransactionFinancialStats(oldPeriod, NOW);
    expect(s.reconciliation.status).toBe("not_run");
    expect("counts" in s.reconciliation).toBe(false);
  });

  test("periodHasReconciliationRun distinguishes the two scenarios", () => {
    expect(periodHasReconciliationRun(septWide, NOW)).toBe(true);
    expect(periodHasReconciliationRun(oldPeriod, NOW)).toBe(false);
  });

  test("zero-volume: an inverted / empty range produces graceful zeros", () => {
    const s = buildTransactionFinancialStats(
      { range: { from: "2026-09-15", to: "2026-09-01" } },
      NOW
    );
    expect(s.totalVolume).toBe(0);
    expect(s.totalCount).toBe(0);
    expect(s.breakdown.every((r) => r.volume === 0 && r.count === 0)).toBe(
      true
    );
  });

  test("is deterministic for the same params", () => {
    expect(buildTransactionFinancialStats(septWide, NOW)).toEqual(
      buildTransactionFinancialStats(septWide, NOW)
    );
  });
});

describe("buildAdminActivityReport", () => {
  // Wide range that covers the whole ~140-day mock span.
  const wide: ReportParams = {
    range: { from: "2026-01-01", to: "2026-12-31" },
    adminActivityType: "all",
  };

  test("the mock dataset spans 40+ events across all four event types", () => {
    const events = buildAdminActivityDataset(BASE);
    expect(events.length).toBeGreaterThanOrEqual(40);
    const types = new Set(events.map((e) => e.type));
    expect(types).toEqual(
      new Set([
        "admin_invited",
        "admin_role_changed",
        "admin_account_status_changed",
        "user_status_changed",
      ])
    );
  });

  test("events come back newest-first", () => {
    const { events } = buildAdminActivityReport(wide, BASE);
    for (let i = 1; i < events.length; i += 1) {
      expect(
        new Date(events[i - 1].createdAt).getTime()
      ).toBeGreaterThanOrEqual(new Date(events[i].createdAt).getTime());
    }
  });

  test("the Action Type filter narrows the list to one type", () => {
    const all = buildAdminActivityReport(wide, BASE);
    const roleOnly = buildAdminActivityReport(
      { ...wide, adminActivityType: "admin_role_changed" },
      BASE
    );
    expect(roleOnly.events.every((e) => e.type === "admin_role_changed")).toBe(
      true
    );
    expect(roleOnly.totalActions).toBeGreaterThan(0);
    expect(roleOnly.totalActions).toBeLessThan(all.totalActions);
    expect(roleOnly.totalActions).toBe(roleOnly.events.length);
  });

  test("the date range genuinely narrows the result set", () => {
    const wideCount = buildAdminActivityReport(wide, BASE).totalActions;
    const narrow = buildAdminActivityReport(
      { range: { from: "2026-08-25", to: "2026-09-01" } },
      BASE
    );
    expect(narrow.totalActions).toBeLessThan(wideCount);
  });

  test("empty result: a far-past range yields zero actions (not fabricated rows)", () => {
    const { totalActions, events } = buildAdminActivityReport(
      { range: { from: "2019-01-01", to: "2019-01-31" } },
      BASE
    );
    expect(totalActions).toBe(0);
    expect(events).toEqual([]);
  });

  test("is deterministic for the same base + params", () => {
    expect(buildAdminActivityReport(wide, BASE)).toEqual(
      buildAdminActivityReport(wide, BASE)
    );
  });
});

describe("buildGeneratedReport", () => {
  test("echoes type + params and stamps the generated time", () => {
    const params = { range: { from: "2026-08-01", to: "2026-08-31" } };
    const report = buildGeneratedReport("user_kyc", params, BASE);
    expect(report.typeId).toBe("user_kyc");
    expect(report.params).toEqual(params);
    expect(report.generatedAt).toBe(new Date(BASE).toISOString());
  });
});
