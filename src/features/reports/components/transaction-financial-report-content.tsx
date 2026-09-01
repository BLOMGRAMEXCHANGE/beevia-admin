import { AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatNaira } from "@/lib/format";
import { DISCREPANCY_LABEL } from "@/features/reconciliation/constants";
import { buildTransactionFinancialStats } from "@/features/reports/mock-data";
import { ReportStatCard } from "@/features/reports/components/report-stat-card";
import type { DiscrepancyType } from "@/features/reconciliation/types";
import type { GeneratedReport } from "@/features/reports/types";

const numberFormat = new Intl.NumberFormat("en-US");

/**
 * Transaction & Financial report body — an aggregate snapshot for the selected
 * period and transaction-type filter. Not a per-transaction list: the
 * "All Transactions" tab already handles that.
 */
export function TransactionFinancialReportContent({
  report,
}: {
  report: GeneratedReport;
}) {
  // Anchor the reconciliation "current month" window to generation time so the
  // preview and the CSV export always agree.
  const stats = buildTransactionFinancialStats(
    report.params,
    Date.parse(report.generatedAt)
  );
  const isFiltered = stats.transactionType !== "all";
  const recon = stats.reconciliation;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ReportStatCard
          title="Total Transaction Volume"
          value={formatNaira(stats.totalVolume)}
        />
        <ReportStatCard
          title="Total Transaction Count"
          value={numberFormat.format(stats.totalCount)}
        />
      </div>

      {/* 2. Breakdown by type */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium">Breakdown by Type</h3>
        {isFiltered && (
          // Filter narrowed to a single type — the breakdown collapses to that
          // one row (same call made for RP2's segmented view: keep the section,
          // don't hide it, so the number still has a labelled home).
          <p className="text-xs text-muted-foreground">
            Filtered to a single transaction type.
          </p>
        )}
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.breakdown.map((row) => (
                <TableRow key={row.type}>
                  <TableCell>{row.label}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNaira(row.volume)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {numberFormat.format(row.count)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 3. Reconciliation discrepancy summary */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium">
          Reconciliation Discrepancy Summary
        </h3>
        {recon.status === "not_run" ? (
          <div className="flex items-start gap-2 rounded-lg border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>
              No reconciliation was run for this period. Discrepancy counts
              aren&apos;t shown because no check took place — this is not the
              same as a clean result.
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              Reconciliation ran on {formatDate(recon.ranAt)} covering this
              period.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {(Object.keys(DISCREPANCY_LABEL) as DiscrepancyType[]).map(
                (type) => (
                  <ReportStatCard
                    key={type}
                    title={DISCREPANCY_LABEL[type]}
                    value={numberFormat.format(recon.counts[type])}
                  />
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
