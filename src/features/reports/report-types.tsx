import { FileText, ScrollText, Wallet } from "lucide-react";
import type {
  GeneratedReport,
  ReportParams,
  ReportTypeId,
} from "@/features/reports/types";
import { UserKycReportContent } from "@/features/reports/components/user-kyc-report-content";
import { UserKycFilters } from "@/features/reports/components/user-kyc-filters";
import { TransactionFinancialReportContent } from "@/features/reports/components/transaction-financial-report-content";
import { TransactionFinancialFilters } from "@/features/reports/components/transaction-financial-filters";
import { AdminActivityReportContent } from "@/features/reports/components/admin-activity-report-content";
import { AdminActivityFilters } from "@/features/reports/components/admin-activity-filters";
import {
  buildAdminActivityCsv,
  buildTransactionFinancialCsv,
  buildUserKycCsv,
  type CsvExport,
} from "@/features/reports/csv";

/**
 * The single source of truth for available report types. The gallery, the
 * parameter form, the preview and the history list all read from this array.
 *
 * TO ADD A FOURTH REPORT TYPE: add one entry here (and its `ReportTypeId` in
 * types.ts) — no component duplication required.
 */
export interface ReportTypeDef {
  id: ReportTypeId;
  title: string;
  /** One-line description shown on the gallery card. */
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Renders the report's preview body from the generated report. */
  renderPreview: (report: GeneratedReport) => React.ReactNode;
  /**
   * Renders this report type's own filters into the parameter form's extension
   * point. Omit for report types that only need the shared date range.
   */
  renderFilters?: (args: {
    params: ReportParams;
    onChange: (params: ReportParams) => void;
  }) => React.ReactNode;
  /** Builds a client-side CSV export of the currently displayed content. */
  buildCsv?: (report: GeneratedReport) => CsvExport;
}

export const REPORT_TYPES: ReportTypeDef[] = [
  {
    id: "user_kyc",
    title: "User & KYC Report",
    description:
      "New sign-ups and identity-verification outcomes over the selected period.",
    icon: FileText,
    renderPreview: (report) => <UserKycReportContent params={report.params} />,
    renderFilters: ({ params, onChange }) => (
      <UserKycFilters params={params} onChange={onChange} />
    ),
    buildCsv: buildUserKycCsv,
  },
  {
    id: "transaction_financial",
    title: "Transaction & Financial Report",
    description:
      "Transaction volume, value and financial movement across the platform.",
    icon: Wallet,
    renderPreview: (report) => (
      <TransactionFinancialReportContent report={report} />
    ),
    renderFilters: ({ params, onChange }) => (
      <TransactionFinancialFilters params={params} onChange={onChange} />
    ),
    buildCsv: buildTransactionFinancialCsv,
  },
  {
    id: "admin_activity",
    title: "Admin Activity / Audit Report",
    description:
      "Actions taken by admins — approvals, changes and account interventions.",
    icon: ScrollText,
    renderPreview: (report) => (
      // `key` forces a fresh component (page state reset) per generated report.
      <AdminActivityReportContent key={report.generatedAt} report={report} />
    ),
    renderFilters: ({ params, onChange }) => (
      <AdminActivityFilters params={params} onChange={onChange} />
    ),
    buildCsv: buildAdminActivityCsv,
  },
];

export function getReportType(id: ReportTypeId): ReportTypeDef {
  const def = REPORT_TYPES.find((type) => type.id === id);
  if (!def) throw new Error(`Unknown report type: ${id}`);
  return def;
}
