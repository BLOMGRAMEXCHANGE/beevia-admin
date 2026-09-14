import { AlertTriangle, Download, FileClock, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ReportsPageMeta } from "@/features/reports/api";
import { ReportStatusBadge } from "@/features/reports/components/report-status-badge";
import {
  describeFilters,
  formatReportDateTime,
  formatReportWindow,
} from "@/features/reports/presentation";
import {
  ANY_FILTER_VALUE,
  type Report,
  type ReportListFilters,
  type ReportStatus,
  type ReportType,
} from "@/features/reports/types";

/**
 * Statuses offered as a list filter. `running` is left out: it's this app's
 * name for "in flight", not a value the backend has been seen to accept.
 */
const STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: "ready", label: "Ready" },
  { value: "queued", label: "Queued" },
  { value: "failed", label: "Failed" },
];

function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const selected = options.find((option) => option.value === value);
  return (
    <Select
      value={value || ANY_FILTER_VALUE}
      onValueChange={(next) => {
        const raw = String(next);
        onChange(raw === ANY_FILTER_VALUE ? "" : raw);
      }}
    >
      <SelectTrigger id={id} aria-label={label} size="sm" className="w-44">
        <SelectValue>
          {selected?.label ?? `All ${label.toLowerCase()}`}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY_FILTER_VALUE}>
          All {label.toLowerCase()}
        </SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StatusCell({ report }: { report: Report }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <ReportStatusBadge status={report.status} />
      {report.status === "ready" && report.rowCount !== null && (
        <span className="text-xs text-muted-foreground">
          {report.rowCount.toLocaleString()}{" "}
          {report.rowCount === 1 ? "row" : "rows"}
          {report.truncated && (
            <span className="text-amber-700 dark:text-amber-400">
              {" "}
              · capped
            </span>
          )}
        </span>
      )}
      {report.status === "failed" && report.error && (
        <span
          title={report.error}
          className="block max-w-[22ch] truncate text-xs text-muted-foreground"
        >
          {report.error}
        </span>
      )}
    </div>
  );
}

export interface RecentReportsProps {
  reports: Report[] | undefined;
  meta: ReportsPageMeta | undefined;
  isLoading: boolean;
  /** Showing the previous page's rows while the next one loads. */
  isRefreshing: boolean;
  error: Error | null;
  onRetry: () => void;
  /** The catalogue, for the type filter and filter wording. */
  types: ReportType[] | undefined;
  filters: ReportListFilters;
  onFiltersChange: (filters: ReportListFilters) => void;
  page: number;
  onPageChange: (page: number) => void;
  onOpen: (report: Report) => void;
  onDownload: (report: Report) => void;
  /** Id of the report whose CSV is currently downloading. */
  downloadingId: string | null;
}

/**
 * Reports generated on the platform, newest first — the admin's own by
 * default, everyone's (that they may view) on the other tab. Rows open the
 * full report; ready ones download straight from the list.
 */
export function RecentReports({
  reports,
  meta,
  isLoading,
  isRefreshing,
  error,
  onRetry,
  types,
  filters,
  onFiltersChange,
  page,
  onPageChange,
  onOpen,
  onDownload,
  downloadingId,
}: RecentReportsProps) {
  const hasFilters = Boolean(filters.type || filters.status);

  const columns: DataTableColumn<Report>[] = [
    {
      header: "Report",
      cell: (report) => {
        const type = types?.find((item) => item.id === report.type);
        const applied = describeFilters(report.filters, type);
        return (
          <div className="flex min-w-48 flex-col gap-0.5">
            <span className="font-medium">{type?.label ?? report.label}</span>
            <span className="text-xs text-muted-foreground">
              {applied.length === 0
                ? "No filters"
                : applied
                    .map((filter) => `${filter.label}: ${filter.value}`)
                    .join(" · ")}
            </span>
          </div>
        );
      },
    },
    {
      header: "Period",
      className: "whitespace-nowrap",
      cell: (report) => formatReportWindow(report.dateFrom, report.dateTo),
    },
    { header: "Status", cell: (report) => <StatusCell report={report} /> },
    {
      header: "Requested",
      className: "whitespace-nowrap",
      cell: (report) => (
        <div className="flex flex-col gap-0.5">
          {!filters.mine && (
            <span>{report.requestedBy.name ?? "Unknown admin"}</span>
          )}
          <span
            className="text-xs text-muted-foreground"
            title={formatReportDateTime(report.createdAt)}
          >
            {formatRelativeTime(report.createdAt)}
          </span>
        </div>
      ),
    },
    {
      header: "Actions",
      className: "w-px text-right",
      cell: (report) => {
        const isDownloading = downloadingId === report.id;
        return (
          <div
            className="flex items-center justify-end gap-1"
            onClick={(event) => event.stopPropagation()}
          >
            {report.status === "ready" && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Download ${report.label} CSV`}
                title="Download CSV"
                disabled={isDownloading}
                onClick={() => onDownload(report)}
              >
                {isDownloading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onOpen(report)}>
              Open
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          Recent reports
          {meta && <Badge variant="secondary">{meta.total}</Badge>}
        </CardTitle>
        <CardDescription>
          {filters.mine
            ? "Reports you've generated."
            : "Reports generated by admins, limited to modules you can view."}
        </CardDescription>
        <CardAction>
          <Tabs
            value={filters.mine ? "mine" : "all"}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, mine: value === "mine" })
            }
          >
            <TabsList>
              <TabsTrigger value="mine">Mine</TabsTrigger>
              <TabsTrigger value="all">All admins</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            id="recent-reports-type"
            label="Types"
            value={filters.type}
            options={(types ?? []).map((type) => ({
              value: type.id,
              label: type.label,
            }))}
            onChange={(type) => onFiltersChange({ ...filters, type })}
          />
          <FilterSelect
            id="recent-reports-status"
            label="Statuses"
            value={filters.status}
            options={STATUS_OPTIONS}
            onChange={(status) =>
              onFiltersChange({
                ...filters,
                status: status as ReportListFilters["status"],
              })
            }
          />
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                onFiltersChange({ ...filters, type: "", status: "" })
              }
            >
              <X data-icon="inline-start" className="size-4" />
              Clear filters
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <AlertTriangle className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">Couldn&apos;t load reports</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {error.message}
            </p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try again
            </Button>
          </div>
        ) : !reports || reports.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <FileClock className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">
              {hasFilters
                ? "No reports match these filters"
                : filters.mine
                  ? "You haven't generated any reports yet"
                  : "No reports generated yet"}
            </p>
            <p className="max-w-xs text-sm text-muted-foreground">
              {hasFilters
                ? "Try a different type or status."
                : "Pick a report type above and generate one — it'll show up here."}
            </p>
          </div>
        ) : (
          <div
            className={cn(
              "flex flex-col gap-4 transition-opacity",
              isRefreshing && "opacity-60"
            )}
          >
            <div className="overflow-x-auto">
              <DataTable
                columns={columns}
                data={reports}
                getRowId={(report) => report.id}
                onRowClick={onOpen}
              />
            </div>
            <PaginationControls
              page={meta?.currentPage ?? page}
              pageCount={meta?.totalPages ?? 1}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
