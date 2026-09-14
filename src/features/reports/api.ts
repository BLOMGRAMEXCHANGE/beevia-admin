import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { liveClient } from "@/lib/api-client";
import { triggerBlobDownload } from "@/lib/csv";
import { isReportTypeAvailable } from "@/features/reports/report-catalogue";
import {
  ANY_FILTER_VALUE,
  isTerminalReportStatus,
  toReportStatus,
  type Report,
  type ReportColumn,
  type ReportListFilters,
  type ReportParams,
  type ReportPreviewData,
  type ReportRow,
  type ReportType,
  type ReportTypeId,
} from "@/features/reports/types";

export class ReportsApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

function toReportsApiError(error: unknown): ReportsApiError {
  if (isAxiosError<{ message?: string }>(error)) {
    return new ReportsApiError(
      error.response?.data?.message ?? "Something went wrong.",
      error.response?.status
    );
  }
  return new ReportsApiError("Something went wrong.");
}

/* -------------------------------------------------------------------------- */
/*  GET /admin/reports/types — the catalogue                                   */
/* -------------------------------------------------------------------------- */

interface ReportTypeData {
  type: string;
  label: string;
  description: string;
  columns: ReportColumn[];
  filters: {
    key: string;
    label: string;
    options: { value: string; label: string }[];
  }[];
}

function toReportType(data: ReportTypeData): ReportType {
  return {
    id: data.type,
    label: data.label,
    description: data.description ?? "",
    columns: data.columns ?? [],
    filters: (data.filters ?? []).map((filter) => ({
      key: filter.key,
      label: filter.label,
      options: filter.options ?? [],
    })),
  };
}

/**
 * The catalogue is scoped to what the signed-in admin may view (the backend
 * omits types they have no access to), and it changes rarely — so it's cached
 * for the session rather than refetched on every visit to the page.
 */
export function useReportTypes() {
  return useQuery({
    queryKey: ["reports", "types"],
    queryFn: async () => {
      try {
        const { data } = await liveClient.get<{ data: ReportTypeData[] }>(
          "/admin/reports/types"
        );
        return (data.data ?? [])
          .filter((type) => isReportTypeAvailable(type.type))
          .map(toReportType);
      } catch (error) {
        throw toReportsApiError(error);
      }
    },
    staleTime: 30 * 60 * 1000,
  });
}

/* -------------------------------------------------------------------------- */
/*  Report resource                                                            */
/* -------------------------------------------------------------------------- */

interface ReportData {
  id: string;
  type: string;
  label: string;
  status: string;
  date_from: string;
  date_to: string;
  filters: Record<string, string> | null;
  row_count: number | null;
  truncated: boolean;
  error: string | null;
  requested_by: { admin_id: string; name: string } | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  download_url: string | null;
  /** Absent on list items — only `GET /admin/reports/{id}` carries it. */
  preview?: {
    rows: ReportRow[];
    totals: Record<string, unknown> | null;
    columns: ReportColumn[];
  } | null;
}

function toReport(data: ReportData): Report {
  const preview: ReportPreviewData | null = data.preview
    ? {
        rows: data.preview.rows ?? [],
        totals: data.preview.totals ?? null,
        columns: data.preview.columns ?? [],
      }
    : null;

  return {
    id: data.id,
    type: data.type,
    label: data.label,
    status: toReportStatus(data.status),
    dateFrom: data.date_from,
    dateTo: data.date_to,
    filters: data.filters ?? {},
    rowCount: data.row_count,
    truncated: Boolean(data.truncated),
    error: data.error,
    requestedBy: {
      adminId: data.requested_by?.admin_id ?? null,
      name: data.requested_by?.name ?? null,
    },
    createdAt: data.created_at,
    startedAt: data.started_at,
    completedAt: data.completed_at,
    downloadUrl: data.download_url,
    preview,
  };
}

/* -------------------------------------------------------------------------- */
/*  POST /admin/reports — queue a generation run                               */
/* -------------------------------------------------------------------------- */

export interface GenerateReportInput {
  typeId: ReportTypeId;
  params: ReportParams;
}

/**
 * Drops "no filtering" selections. The API treats an absent key as unfiltered;
 * sending `"all"` would be read as a literal filter value.
 */
function toRequestFilters(filters: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value && value !== ANY_FILTER_VALUE
    )
  );
}

/**
 * Queues a report. The response comes back `queued` with no preview — the
 * caller polls the returned id via `useReport` until it settles.
 */
export function useGenerateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ typeId, params }: GenerateReportInput) => {
      try {
        const { data } = await liveClient.post<{ data: ReportData }>(
          "/admin/reports",
          {
            type: typeId,
            dateFrom: params.range.from,
            dateTo: params.range.to,
            filters: toRequestFilters(params.filters),
          }
        );
        return toReport(data.data);
      } catch (error) {
        throw toReportsApiError(error);
      }
    },
    onSuccess: (report) => {
      // Seed the cache so the preview screen renders the queued report
      // immediately, before the first poll lands. (Safe only because it's not
      // settled yet — a settled report is never refetched, see `useReport`.)
      queryClient.setQueryData(["reports", "detail", report.id], report);
      queryClient.invalidateQueries({ queryKey: ["reports", "list"] });
    },
  });
}

/* -------------------------------------------------------------------------- */
/*  GET /admin/reports — recent reports                                        */
/* -------------------------------------------------------------------------- */

export const RECENT_REPORTS_PAGE_LIMIT = 10;
const LIST_POLL_INTERVAL_MS = 4000;

export interface ReportsPageMeta {
  total: number;
  currentPage: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ReportsListResponseData {
  data: ReportData[];
  meta: {
    total: number;
    current_page: number;
    limit: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
}

/**
 * Newest first. List items are the report without its preview, so they're
 * NOT written into the detail cache — opening one always fetches the preview.
 * While anything on the page is still generating the list re-polls, so a
 * queued row flips to Ready without the admin refreshing.
 */
export function useRecentReports(
  filters: ReportListFilters,
  page: number,
  {
    limit = RECENT_REPORTS_PAGE_LIMIT,
    enabled = true,
  }: { limit?: number; enabled?: boolean } = {}
) {
  return useQuery({
    enabled,
    queryKey: ["reports", "list", filters, page, limit],
    queryFn: async () => {
      try {
        const { data } = await liveClient.get<ReportsListResponseData>(
          "/admin/reports",
          {
            params: {
              page,
              limit,
              type: filters.type || undefined,
              status: filters.status || undefined,
              // Absent means everyone's reports the admin is allowed to see.
              mine: filters.mine ? true : undefined,
            },
          }
        );
        const meta: ReportsPageMeta = {
          total: data.meta.total,
          currentPage: data.meta.current_page,
          limit: data.meta.limit,
          totalPages: data.meta.total_pages,
          hasNextPage: data.meta.has_next_page,
          hasPrevPage: data.meta.has_prev_page,
        };
        return { reports: (data.data ?? []).map(toReport), meta };
      } catch (error) {
        throw toReportsApiError(error);
      }
    },
    placeholderData: keepPreviousData,
    refetchInterval: (query) => {
      if (query.state.status === "error") return false;
      const reports = query.state.data?.reports ?? [];
      return reports.some((report) => !isTerminalReportStatus(report.status))
        ? LIST_POLL_INTERVAL_MS
        : false;
    },
  });
}

/* -------------------------------------------------------------------------- */
/*  GET /admin/reports/{id} — poll until ready                                 */
/* -------------------------------------------------------------------------- */

const POLL_INTERVAL_MS = 1500;
const SLOW_POLL_INTERVAL_MS = 5000;
/** After this many polls (~30s) a report is clearly a big one — back off. */
const FAST_POLL_LIMIT = 20;

/**
 * Fetches one report, polling while it's still `queued`/`running` and stopping
 * the moment it reaches `ready` or `failed`. Small reports come back ready on
 * the first poll; the loop exists for the ones that don't. A settled report
 * never changes, so it's treated as fresh for as long as it stays cached.
 */
export function useReport(reportId: string | null) {
  return useQuery({
    queryKey: ["reports", "detail", reportId],
    queryFn: async () => {
      try {
        const { data } = await liveClient.get<{ data: ReportData }>(
          `/admin/reports/${reportId}`
        );
        return toReport(data.data);
      } catch (error) {
        throw toReportsApiError(error);
      }
    },
    enabled: Boolean(reportId),
    retry: false,
    staleTime: (query) =>
      query.state.data && isTerminalReportStatus(query.state.data.status)
        ? Infinity
        : 0,
    refetchInterval: (query) => {
      // A 404/403 won't fix itself by asking again.
      if (query.state.status === "error") return false;
      const report = query.state.data;
      if (report && isTerminalReportStatus(report.status)) return false;
      return query.state.dataUpdateCount > FAST_POLL_LIMIT
        ? SLOW_POLL_INTERVAL_MS
        : POLL_INTERVAL_MS;
    },
  });
}

/* -------------------------------------------------------------------------- */
/*  GET /admin/reports/{id}/download — CSV                                     */
/* -------------------------------------------------------------------------- */

function contentDispositionFilename(headerValue: unknown): string | null {
  if (typeof headerValue !== "string") return null;
  const match = headerValue.match(/filename="?([^";]+)"?/i);
  return match ? match[1] : null;
}

/** `2026-09-01T00:00:00.000Z` → `2026-09-01`, for the fallback filename. */
function toDatePart(iso: string): string {
  return iso.slice(0, 10);
}

function fallbackFilename(report: Report): string {
  return `beevia-${report.type}-${toDatePart(report.dateFrom)}-to-${toDatePart(
    report.dateTo
  )}.csv`;
}

/**
 * With `responseType: "blob"` an error body arrives as a Blob too, so the
 * backend's JSON `message` has to be read out of it before it can be shown.
 */
async function toDownloadError(error: unknown): Promise<ReportsApiError> {
  if (isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const body = JSON.parse(await error.response.data.text()) as {
        message?: string;
      };
      return new ReportsApiError(
        body.message ?? "Couldn't download this report.",
        error.response.status
      );
    } catch {
      return new ReportsApiError(
        "Couldn't download this report.",
        error.response.status
      );
    }
  }
  return toReportsApiError(error);
}

/**
 * Downloads the generated CSV. The file is fetched through the authenticated
 * client (a plain link can't carry the bearer token) and handed to the browser
 * as an object URL. `download_url` is an API path, not an absolute URL, so it
 * resolves against the same base as every other request.
 */
export function useDownloadReport() {
  return useMutation({
    mutationFn: async (report: Report) => {
      const url = report.downloadUrl ?? `/admin/reports/${report.id}/download`;
      try {
        const response = await liveClient.get(url, { responseType: "blob" });
        const filename =
          contentDispositionFilename(response.headers["content-disposition"]) ??
          fallbackFilename(report);
        triggerBlobDownload(response.data, filename);
      } catch (error) {
        throw await toDownloadError(error);
      }
    },
  });
}
