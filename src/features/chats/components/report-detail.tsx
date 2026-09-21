"use client";

import Link from "next/link";
import { ArrowUpRight, Ban, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversationTypeBadge } from "@/features/chats/components/conversation-type-badge";
import { ConversationParticipants } from "@/features/chats/components/conversation-participants";
import { ReportReasonBadge } from "@/features/chats/components/report-reason-badge";
import { ReportReviewForm } from "@/features/chats/components/report-review-form";
import { ReportStatusBadge } from "@/features/chats/components/report-status-badge";
import { ReportedMessages } from "@/features/chats/components/reported-messages";
import { ChatApiError, useReportDetail } from "@/features/chats/api";
import { conversationLabel } from "@/features/chats/constants";
import { formatDateTime } from "@/lib/format";
import type { ReportDetail as ReportDetailModel } from "@/features/chats/types";

function ReportDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

function ReviewSummary({ report }: { report: ReportDetailModel }) {
  if (!report.review) {
    return (
      <p className="text-sm text-muted-foreground">
        No decision recorded yet. This report is still waiting on a reviewer.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm">
        <span className="font-medium">
          {report.review.byName || "An admin"}
        </span>{" "}
        marked this <ReportStatusBadge status={report.status} />
        {report.review.at && (
          <span className="text-muted-foreground">
            {" "}
            on {formatDateTime(report.review.at)}
          </span>
        )}
      </p>
      {report.review.note ? (
        <p className="rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap">
          {report.review.note}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">No note was left.</p>
      )}
    </div>
  );
}

export function ReportDetail({ reportId }: { reportId: string }) {
  const { data: report, isLoading, isError, error } = useReportDetail(reportId);

  if (isLoading) {
    return <ReportDetailSkeleton />;
  }

  if (error instanceof ChatApiError && error.status === 404) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="font-medium">This report doesn&apos;t exist</p>
          <p className="text-sm text-muted-foreground">
            No report was found for this ID. It may have been removed or the
            link may be incorrect.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isError || !report) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="font-medium">Something went wrong</p>
          <p className="text-sm text-muted-foreground">
            {error instanceof ChatApiError
              ? error.message
              : "This report could not be loaded. Please try again."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Flag className="size-5 text-muted-foreground" />
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              Report
            </h1>
            <ReportStatusBadge status={report.status} />
            {report.blockedContact && (
              <Badge variant="outline" title="The reporter also blocked them">
                <Ban data-icon="inline-start" />
                Contact blocked
              </Badge>
            )}
          </div>
          <p className="font-mono text-sm text-muted-foreground">{report.id}</p>
        </div>

        {report.conversation && (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/chats/${report.conversation.id}`} />}
          >
            Open conversation
            <ArrowUpRight data-icon="inline-end" />
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground">Reason</p>
            <ReportReasonBadge reason={report.reason} />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground">Reported by</p>
            {report.reporter?.id ? (
              <Link
                href={`/users/${report.reporter.id}`}
                className="font-medium hover:underline"
              >
                {report.reporter.name || "Unnamed user"}
              </Link>
            ) : (
              <p className="font-medium">Unknown user</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground">Conversation</p>
            {report.conversation ? (
              <span className="flex items-center gap-2">
                <Link
                  href={`/chats/${report.conversation.id}`}
                  className="font-medium hover:underline"
                >
                  {conversationLabel(report.conversation)}
                </Link>
                <ConversationTypeBadge type={report.conversation.type} />
              </span>
            ) : (
              <p className="text-muted-foreground">Unavailable</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground">Filed</p>
            <p>{formatDateTime(report.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <CardTitle className="font-heading text-base">
            Reported messages
          </CardTitle>
          <Badge variant="secondary">{report.messageCount}</Badge>
        </CardHeader>
        <CardContent>
          <ReportedMessages
            messages={report.messages}
            reporterId={report.reporter?.id ?? null}
            messageCount={report.messageCount}
          />
        </CardContent>
      </Card>

      {report.participants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">
              Participants ({report.participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ConversationParticipants
              participants={report.participants}
              createdBy={null}
              reports={
                report.reporter
                  ? [
                      {
                        id: report.id,
                        reporterId: report.reporter.id,
                        reporterName: report.reporter.name,
                        reason: report.reason,
                        createdAt: report.createdAt,
                      },
                    ]
                  : []
              }
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Decision</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <ReviewSummary report={report} />
          <div className="border-t pt-5">
            <ReportReviewForm report={report} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
