import { describe, expect, test } from "vitest";
import {
  describeFilters,
  formatReportMoney,
  formatReportValue,
  formatReportWindow,
  readCell,
  toTotalsView,
  valueLabelsFor,
} from "@/features/reports/presentation";
import type { ReportType } from "@/features/reports/types";

const TRANSACTIONS: ReportType = {
  id: "transactions",
  label: "Transactions",
  description: "",
  columns: [],
  filters: [
    {
      key: "type",
      label: "Type",
      options: [{ value: "escrow_hold", label: "Escrow hold" }],
    },
    {
      key: "status",
      label: "Status",
      options: [{ value: "completed", label: "Completed" }],
    },
  ],
};

describe("readCell", () => {
  test("reads camelCase column keys out of snake_case rows", () => {
    const row = { balance_after: "70900.00", user_name: null };
    expect(readCell(row, "balanceAfter")).toBe("70900.00");
    expect(readCell(row, "userName")).toBeNull();
    expect(readCell(row, "missing")).toBeUndefined();
  });
});

describe("formatReportValue", () => {
  test("money decimal strings keep their kobo", () => {
    expect(formatReportValue("amount", "71000.00")).toBe("₦71,000.00");
    expect(formatReportValue("balanceAfter", "0.50")).toBe("₦0.50");
  });

  test("non-naira rows show their currency code", () => {
    expect(formatReportValue("amount", "1250.00", { currency: "USD" })).toBe(
      "USD 1,250.00"
    );
  });

  test("whole-number counts are never money", () => {
    expect(formatReportValue("total_signups", 1200)).toBe("1,200");
    expect(formatReportValue("entries", 23)).toBe("23");
  });

  test("enum values use the catalogue's wording, then fall back to humanising", () => {
    const labels = valueLabelsFor(TRANSACTIONS.filters);
    expect(formatReportValue("type", "escrow_hold", { labels })).toBe(
      "Escrow hold"
    );
    expect(formatReportValue("type", "escrow_refund", { labels })).toBe(
      "Escrow Refund"
    );
  });

  test("free text and empty values", () => {
    expect(formatReportValue("description", "Card top-up 100.00 NGN")).toBe(
      "Card top-up 100.00 NGN"
    );
    expect(formatReportValue("userName", null)).toBe("—");
    expect(formatReportValue("description", "")).toBe("—");
  });
});

describe("formatReportMoney", () => {
  test("negative naira puts the sign before the symbol", () => {
    expect(formatReportMoney(-500)).toBe("-₦500.00");
  });
});

describe("formatReportWindow", () => {
  test("uses the calendar dates of the UTC boundaries", () => {
    expect(
      formatReportWindow("2026-09-01T00:00:00.000Z", "2026-09-30T23:59:59.999Z")
    ).toMatch(/^01 Sept? 2026 – 30 Sept? 2026$/);
  });
});

describe("toTotalsView", () => {
  test("transaction totals are headline stats", () => {
    expect(
      toTotalsView({ debited: "3523.00", entries: 23, credited: "73516.00" })
    ).toEqual({
      stats: [
        { key: "debited", label: "Debited", value: "₦3,523.00" },
        { key: "entries", label: "Entries", value: "23" },
        { key: "credited", label: "Credited", value: "₦73,516.00" },
      ],
      breakdowns: [],
    });
  });

  test("a group with a zero total has no bar shares but still lists items", () => {
    const { breakdowns } = toTotalsView({ by_verification: { failed: 0 } });
    expect(breakdowns[0].total).toBe(0);
    expect(breakdowns[0].items[0]).toMatchObject({ value: "0", percent: 0 });
  });
});

describe("describeFilters", () => {
  test("words filters from the catalogue, humanising unknown ones", () => {
    expect(
      describeFilters(
        { status: "completed", channel: "bank_transfer" },
        TRANSACTIONS
      )
    ).toEqual([
      { key: "status", label: "Status", value: "Completed" },
      { key: "channel", label: "Channel", value: "Bank Transfer" },
    ]);
  });
});

/*
 * Admin actions (audit). Only the catalogue entry and the queued response are
 * confirmed; the row and totals shapes below are the plausible variants the
 * formatter must survive until a ready preview has been seen.
 */
const ADMIN_ACTIVITY: ReportType = {
  id: "admin_activity",
  label: "Admin actions (audit)",
  description: "",
  columns: [
    { key: "occurredAt", label: "When" },
    { key: "action", label: "Action" },
    { key: "actor", label: "Admin" },
    { key: "targetType", label: "Target type" },
    { key: "target", label: "Target" },
    { key: "summary", label: "Details" },
    { key: "module", label: "Module" },
    { key: "targetId", label: "Target ID" },
  ],
  filters: [
    {
      key: "action",
      label: "Action",
      options: [
        { value: "role_assignment_changed", label: "Role assignment changed" },
        { value: "admin_invited", label: "Admin invited" },
      ],
    },
  ],
};

describe("admin activity rows", () => {
  const labels = valueLabelsFor(ADMIN_ACTIVITY.filters);

  test("action uses the catalogue wording; snake_case keys resolve", () => {
    const row = {
      occurred_at: "2026-09-03T09:15:00.000Z",
      action: "role_assignment_changed",
      target_type: "admin_account",
      target_id: "2b1c",
    };
    expect(
      formatReportValue("action", readCell(row, "action"), { labels })
    ).toBe("Role assignment changed");
    expect(formatReportValue("targetType", readCell(row, "targetType"))).toBe(
      "Admin Account"
    );
    expect(readCell(row, "targetId")).toBe("2b1c");
    expect(
      formatReportValue("occurredAt", readCell(row, "occurredAt"))
    ).toMatch(/2026/);
  });

  test("actor and target read as names whether strings or objects", () => {
    expect(formatReportValue("actor", "Beevia Super Admin")).toBe(
      "Beevia Super Admin"
    );
    expect(
      formatReportValue("actor", {
        admin_id: "c8bb10c4",
        name: "Beevia Super Admin",
      })
    ).toBe("Beevia Super Admin");
    expect(
      formatReportValue("target", { id: "u1", email: "jo@beevia.app" })
    ).toBe("jo@beevia.app");
    expect(formatReportValue("target", { user_id: "u1" })).toBe("u1");
    expect(formatReportValue("target", {})).toBe("—");
  });

  test("totals grouped by action use the catalogue wording", () => {
    const { stats, breakdowns } = toTotalsView(
      { entries: 5, by_action: { admin_invited: 2, admin_reactivated: 3 } },
      ADMIN_ACTIVITY
    );
    expect(stats).toEqual([{ key: "entries", label: "Entries", value: "5" }]);
    expect(breakdowns[0].label).toBe("Action");
    expect(breakdowns[0].items.map((item) => item.label)).toEqual([
      "Admin invited",
      "Admin Reactivated",
    ]);
  });
});

/*
 * User signups & verification. Catalogue and queued response are confirmed;
 * row and totals shapes are assumed until a ready preview has been seen.
 */
const USER_SIGNUPS: ReportType = {
  id: "user_signups",
  label: "User signups & verification",
  description: "",
  columns: [],
  filters: [
    {
      key: "accountType",
      label: "Account type",
      options: [
        { value: "chat_only", label: "Chat only" },
        { value: "chat_banking", label: "Chat banking" },
      ],
    },
    {
      key: "verification",
      label: "Verification",
      options: [
        { value: "verified", label: "Verified" },
        { value: "pending", label: "Pending" },
        { value: "failed", label: "Failed" },
      ],
    },
  ],
};

describe("user signup rows", () => {
  const labels = valueLabelsFor(USER_SIGNUPS.filters);

  test("phone numbers are shown verbatim, never as quantities", () => {
    expect(formatReportValue("phone", "08012345678")).toBe("08012345678");
    expect(formatReportValue("phone", "2348012345678")).toBe("2348012345678");
    expect(formatReportValue("phone", "+2348012345678")).toBe("+2348012345678");
  });

  test("account type and verification use the catalogue wording", () => {
    const row = { account_type: "chat_banking", verification: "pending" };
    expect(
      formatReportValue("accountType", readCell(row, "accountType"), {
        labels,
      })
    ).toBe("Chat banking");
    expect(
      formatReportValue("verification", readCell(row, "verification"), {
        labels,
      })
    ).toBe("Pending");
  });

  test("totals split into a headline and two breakdowns", () => {
    const { stats, breakdowns } = toTotalsView(
      {
        signups: 20,
        by_verification: { verified: 15, pending: 4, failed: 1 },
        by_account_type: { chat_only: 12, chat_banking: 8 },
      },
      USER_SIGNUPS
    );
    expect(stats).toEqual([{ key: "signups", label: "Signups", value: "20" }]);

    const [verification, accountType] = breakdowns;
    expect(verification).toMatchObject({ label: "Verification", total: 20 });
    expect(verification.items).toEqual([
      expect.objectContaining({
        label: "Verified",
        percent: 75,
        tone: "green",
      }),
      expect.objectContaining({ label: "Pending", percent: 20, tone: "amber" }),
      expect.objectContaining({ label: "Failed", percent: 5, tone: "red" }),
    ]);
    expect(accountType).toMatchObject({ label: "Account type", total: 20 });
    expect(accountType.items.map((item) => item.label)).toEqual([
      "Chat only",
      "Chat banking",
    ]);
  });
});
