/**
 * RP1 — the shared reports shell. These types describe the generic flow
 * (pick a type → set params → generate → preview). Report-specific parameter
 * and content shapes are intentionally NOT modelled here yet; each of the three
 * real report types gets its own follow-on pass.
 */

import type { WalletTransactionType } from "@/features/wallet/types";
import type { DiscrepancyType } from "@/features/reconciliation/types";
import type { ActivityEventType } from "@/features/dashboard/mock/activity";

export type ReportTypeId =
  "user_kyc" | "transaction_financial" | "admin_activity";

/** The date range every report requires. `from`/`to` are `yyyy-mm-dd` strings. */
export interface DateRange {
  from: string;
  to: string;
}

/**
 * Account-type segment filter — specific to the User & KYC report (RP2).
 * "all" means no segmentation.
 */
export type AccountTypeFilter = "all" | "chat_only" | "chat_banking";

export const ACCOUNT_TYPE_LABELS: Record<AccountTypeFilter, string> = {
  all: "All",
  chat_only: "Chat Only",
  chat_banking: "Chat + Banking",
};

/**
 * Parameters submitted from the parameter form. The date range is required for
 * every report type; report-specific filters are optional fields added here as
 * each report type is built out (e.g. `accountType` for the User & KYC report).
 */
export interface ReportParams {
  range: DateRange;
  /** User & KYC report only. Absent on other report types. */
  accountType?: AccountTypeFilter;
  /** Transaction & Financial report only. Absent on other report types. */
  transactionType?: TransactionTypeFilter;
  /** Admin Activity / Audit report only. Absent on other report types. */
  adminActivityType?: AdminActivityTypeFilter;
}

/**
 * Action-type filter for the Admin Activity / Audit report (RP4). Uses the
 * exact event types from Dashboard Home's Recent Activity feed
 * (`ActivityEventType`); "all" means no filtering.
 */
export type AdminActivityTypeFilter = ActivityEventType | "all";

/** Filter labels — the wording shown in the Action Type select. */
export const ADMIN_ACTIVITY_TYPE_LABELS: Record<
  AdminActivityTypeFilter,
  string
> = {
  all: "All",
  admin_invited: "Admin Invited",
  admin_role_changed: "Role Changed",
  admin_account_status_changed: "Account Status Changed",
  user_status_changed: "User Status Changed",
};

/**
 * Transaction-type filter for the Transaction & Financial report (RP3). Uses
 * the exact same categories as the "All Transactions" tab
 * (`WalletTransactionType`); "all" means no filtering.
 */
export type TransactionTypeFilter = WalletTransactionType | "all";

/** One row of the Transaction & Financial report's by-type breakdown. */
export interface TransactionTypeRow {
  type: WalletTransactionType;
  label: string;
  volume: number;
  count: number;
}

/**
 * Reconciliation discrepancy summary for the selected period. This is a genuine
 * conditional: `not_run` means no reconciliation covered the period, and must
 * NOT be rendered as "zero discrepancies" (that would imply a clean check that
 * never happened).
 */
export type ReconciliationSummary =
  | { status: "not_run" }
  | {
      status: "ran";
      ranAt: string;
      /** Count per discrepancy category — same three as the Reconciliation tab. */
      counts: Record<DiscrepancyType, number>;
    };

/** Aggregate figures shown by the Transaction & Financial report (RP3). */
export interface TransactionFinancialStats {
  transactionType: TransactionTypeFilter;
  totalVolume: number;
  totalCount: number;
  /** All six type rows, or just the selected one when filtered. */
  breakdown: TransactionTypeRow[];
  reconciliation: ReconciliationSummary;
}

/** Aggregate figures shown by the User & KYC report (RP2). */
export interface UserKycStats {
  accountType: AccountTypeFilter;
  totalSignups: number;
  /** verified + pending + failed === totalSignups */
  verified: number;
  pending: number;
  failed: number;
  /** New signups split by account type for the period. */
  breakdown: {
    chatOnly: number;
    chatBanking: number;
  };
}

/** The result of a (mock) "generate" run — enough to render the preview. */
export interface GeneratedReport {
  typeId: ReportTypeId;
  params: ReportParams;
  generatedAt: string;
}

/** A row in the Recent Reports history list. */
export interface RecentReport {
  id: string;
  typeId: ReportTypeId;
  params: ReportParams;
  generatedAt: string;
}
