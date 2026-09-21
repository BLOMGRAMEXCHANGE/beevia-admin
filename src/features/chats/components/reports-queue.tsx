"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, MessageSquare, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { ChatsHeader } from "@/features/chats/components/chats-header";
import { ReportReasonBadge } from "@/features/chats/components/report-reason-badge";
import { ReportStatusBadge } from "@/features/chats/components/report-status-badge";
import { ChatApiError, useReportsQueue } from "@/features/chats/api";
import {
  REPORTS_PAGE_LIMIT,
  REPORT_STATUS_OPTIONS,
  conversationLabel,
  shortId,
} from "@/features/chats/constants";
import type { ReportRecord, ReportStatus } from "@/features/chats/types";
import { formatDate, formatRelativeTime } from "@/lib/format";

type StatusFilter = ReportStatus | "all";

export function ReportsQueue() {
  const router = useRouter();
  // Pending first: the queue exists to be emptied, and anything already
  // decided is history rather than work.
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [page, setPage] = useState(1);

  function handleStatusChange(value: string) {
    setStatus(value as StatusFilter);
    setPage(1);
  }

  const { data, isLoading, isError, error } = useReportsQueue(
    { status: status === "all" ? undefined : status },
    page,
    REPORTS_PAGE_LIMIT
  );

  const columns: DataTableColumn<ReportRecord>[] = [
    {
      header: "Reason",
      cell: (report) => (
        <div className="flex max-w-xs flex-col gap-1">
          <ReportReasonBadge reason={report.reason} className="line-clamp-2" />
          <span className="font-mono text-xs text-muted-foreground">
            {shortId(report.id)}
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (report) => <ReportStatusBadge status={report.status} />,
    },
    {
      header: "Reporter",
      cell: (report) => (
        <span className={report.reporter ? undefined : "text-muted-foreground"}>
          {report.reporter?.name || "Unknown user"}
        </span>
      ),
    },
    {
      header: "Conversation",
      cell: (report) =>
        report.conversation ? (
          <div className="flex items-center gap-2">
            {report.conversation.type === "group" ? (
              <Users className="size-4 text-muted-foreground" />
            ) : (
              <MessageSquare className="size-4 text-muted-foreground" />
            )}
            <span>{conversationLabel(report.conversation)}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">Unavailable</span>
        ),
    },
    {
      header: "Evidence",
      cell: (report) => (
        <div className="flex items-center gap-2">
          <span>
            {report.messageCount}{" "}
            {report.messageCount === 1 ? "message" : "messages"}
          </span>
          {report.blockedContact && (
            <Badge variant="outline" title="The reporter also blocked them">
              <Ban data-icon="inline-start" />
              Blocked
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: "Filed",
      cell: (report) => (
        <span title={formatDate(report.createdAt)}>
          {formatRelativeTime(report.createdAt)}
        </span>
      ),
    },
    {
      header: "Reviewed by",
      cell: (report) =>
        report.review?.byName ? (
          report.review.byName
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  const isForbidden =
    isError && error instanceof ChatApiError && error.status === 403;

  const emptyMessage =
    status === "pending"
      ? "Nothing waiting. Every report has been reviewed."
      : "No reports with this status.";

  return (
    <div className="flex flex-col gap-6">
      <ChatsHeader description="Reports users have filed against conversations, and the decisions taken on them." />

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <CardTitle className="font-heading text-base">Report queue</CardTitle>
          {data && <Badge variant="secondary">{data.pagination.total}</Badge>}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Tabs value={status} onValueChange={handleStatusChange}>
            <TabsList>
              {REPORT_STATUS_OPTIONS.map((option) => (
                <TabsTrigger key={option.value} value={option.value}>
                  {option.label}
                </TabsTrigger>
              ))}
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : isForbidden ? (
            <p className="text-sm text-muted-foreground">
              {(error as ChatApiError).message ||
                "You do not have permission to view reports."}
            </p>
          ) : isError ? (
            <p className="text-sm text-muted-foreground">
              Something went wrong loading reports. Please try again.
            </p>
          ) : (
            <>
              <DataTable
                columns={columns}
                data={data?.reports ?? []}
                getRowId={(report) => report.id}
                emptyMessage={emptyMessage}
                onRowClick={(report) =>
                  router.push(`/chats/reports/${report.id}`)
                }
              />
              <PaginationControls
                page={data?.pagination.page ?? page}
                pageCount={data?.pagination.totalPages ?? 1}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
