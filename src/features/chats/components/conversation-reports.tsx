import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { ReportReasonBadge } from "@/features/chats/components/report-reason-badge";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import type { ConversationReport } from "@/features/chats/types";

export function ConversationReports({
  reports,
}: {
  reports: ConversationReport[];
}) {
  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-6 text-center">
        <ShieldCheck className="size-5 text-muted-foreground" />
        <p className="text-sm font-medium">No reports filed</p>
        <p className="text-sm text-muted-foreground">
          No user has reported this conversation.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y">
      {reports.map((report) => (
        <li
          key={report.id}
          className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
        >
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <ReportReasonBadge reason={report.reason} />
              <span className="text-muted-foreground">reported by</span>
              {report.reporterId ? (
                <Link
                  href={`/users/${report.reporterId}`}
                  className="font-medium hover:underline"
                >
                  {report.reporterName || "Unnamed user"}
                </Link>
              ) : (
                <span className="font-medium">
                  {report.reporterName || "Unknown user"}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDateTime(report.createdAt)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(report.createdAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}
