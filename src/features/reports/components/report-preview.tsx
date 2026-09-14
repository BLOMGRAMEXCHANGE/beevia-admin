"use client";

import {
  AlertTriangle,
  ChevronLeft,
  Download,
  FileSearch,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format";
import { ReportsApiError, useReport } from "@/features/reports/api";
import { useReportDownload } from "@/features/reports/use-report-download";
import { ReportStatusBadge } from "@/features/reports/components/report-status-badge";
import { ReportTable } from "@/features/reports/components/report-table";
import { ReportTotals } from "@/features/reports/components/report-totals";
import {
  describeFilters,
  formatReportDateTime,
  formatReportWindow,
  toTotalsView,
  valueLabelsFor,
} from "@/features/reports/presentation";
import type { Report, ReportType } from "@/features/reports/types";

function ReportSummary({
  report,
  type,
}: {
  report: Report;
  type: ReportType | undefined;
}) {
  const filters = describeFilters(report.filters, type);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        {formatReportWindow(report.dateFrom, report.dateTo)}
        {report.requestedBy.name && (
          <> · Requested by {report.requestedBy.name}</>
        )}
        {" · "}
        <span title={formatReportDateTime(report.createdAt)}>
          {formatRelativeTime(report.createdAt)}
        </span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {filters.length === 0 ? (
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            No filters
          </span>
        ) : (
          filters.map((filter) => (
            <span
              key={filter.key}
              className="rounded-md bg-muted px-2 py-0.5 text-xs"
            >
              <span className="text-muted-foreground">{filter.label}:</span>{" "}
              {filter.value}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function CenteredState({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      {icon}
      <p className="text-sm font-medium">{title}</p>
      {children}
    </div>
  );
}

function ReadyBody({
  report,
  type,
}: {
  report: Report;
  type: ReportType | undefined;
}) {
  const preview = report.preview;
  const labels = valueLabelsFor(type?.filters);
  const totals = toTotalsView(preview?.totals, type);
  const rows = preview?.rows ?? [];
  const columns = preview?.columns.length
    ? preview.columns
    : (type?.columns ?? []);
  const rowCount = report.rowCount ?? rows.length;
  const isSampled = rowCount > rows.length;

  return (
    <div className="flex flex-col gap-4">
      <ReportTotals totals={totals} />

      {report.truncated && (
        <div
          role="status"
          className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            This report hit the row limit, so the download is incomplete too.
            Narrow the date range or add filters to get everything.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Rows</CardTitle>
          <CardDescription>
            {rowCount === 0
              ? "Nothing matched this window and filters."
              : isSampled
                ? `Previewing the first ${rows.length.toLocaleString()} of ${rowCount.toLocaleString()} rows. Download the CSV for all of them.`
                : `${rowCount.toLocaleString()} ${rowCount === 1 ? "row" : "rows"}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <CenteredState
              icon={<FileSearch className="size-6 text-muted-foreground" />}
              title="No rows"
            >
              <p className="max-w-sm text-sm text-muted-foreground">
                Try a wider date range or fewer filters.
              </p>
            </CenteredState>
          ) : (
            <ReportTable
              key={report.id}
              columns={columns}
              rows={rows}
              labels={labels}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * A single report, addressed by id. Covers the whole lifecycle — the queued
 * response from generation, the in-flight polls, and the settled result — so
 * opening from Recent reports and arriving straight from the form are the
 * same screen.
 */
export function ReportPreview({
  reportId,
  type,
  backLabel,
  onBack,
  onRegenerate,
  isRegenerating,
}: {
  reportId: string;
  /** Catalogue entry for the report's type, if it's still offered. */
  type: ReportType | undefined;
  backLabel: string;
  onBack: () => void;
  onRegenerate: (report: Report) => void;
  isRegenerating: boolean;
}) {
  const { data: report, error, isLoading, refetch } = useReport(reportId);
  const { download, downloadingId } = useReportDownload();
  const isDownloading = downloadingId === reportId;

  const isGone =
    error instanceof ReportsApiError &&
    (error.status === 404 || error.status === 403);

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="-ml-2 w-fit text-muted-foreground"
      >
        <ChevronLeft className="size-4" />
        {backLabel}
      </Button>

      <Card>
        {isLoading ? (
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-80 max-w-full" />
            <Skeleton className="h-5 w-40" />
          </CardContent>
        ) : error || !report ? (
          <CardContent>
            <CenteredState
              icon={<AlertTriangle className="size-6 text-muted-foreground" />}
              title={
                isGone
                  ? "This report isn't available"
                  : "Couldn't load this report"
              }
            >
              <p className="max-w-sm text-sm text-muted-foreground">
                {isGone
                  ? "It may have expired, or it belongs to a module you can no longer view."
                  : (error?.message ?? "Something went wrong.")}
              </p>
              {isGone ? (
                <Button variant="outline" size="sm" onClick={onBack}>
                  {backLabel}
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Try again
                </Button>
              )}
            </CenteredState>
          </CardContent>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {report.label}
                <ReportStatusBadge status={report.status} />
              </CardTitle>
              <ReportSummary report={report} type={type} />
              {report.status === "ready" && (
                <CardAction>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => download(report)}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Download className="size-4" />
                    )}
                    Download CSV
                  </Button>
                </CardAction>
              )}
            </CardHeader>

            {report.status === "queued" || report.status === "running" ? (
              <CardContent>
                <CenteredState
                  icon={
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  }
                  title={
                    report.status === "queued"
                      ? "Waiting to start…"
                      : "Generating report…"
                  }
                >
                  <p className="max-w-sm text-sm text-muted-foreground">
                    This updates on its own. You can leave this page — the
                    report stays in Recent reports.
                  </p>
                </CenteredState>
              </CardContent>
            ) : report.status === "failed" ? (
              <CardContent>
                <CenteredState
                  icon={<AlertTriangle className="size-6 text-destructive" />}
                  title="This report couldn't be generated"
                >
                  <p className="max-w-md text-sm text-muted-foreground">
                    {report.error ?? "The report job failed."}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRegenerate(report)}
                    disabled={isRegenerating}
                  >
                    {isRegenerating ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RotateCcw className="size-4" />
                    )}
                    Generate again
                  </Button>
                </CenteredState>
              </CardContent>
            ) : null}
          </>
        )}
      </Card>

      {report?.status === "ready" && <ReadyBody report={report} type={type} />}
    </div>
  );
}
