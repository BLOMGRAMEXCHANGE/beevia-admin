import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ReportedMessage } from "@/features/chats/types";

/** The evidence the reporter attached. Messages from anyone other than the
 * reporter are what the report is actually about, so they're set apart. */
export function ReportedMessages({
  messages,
  reporterId,
  messageCount,
}: {
  messages: ReportedMessage[];
  reporterId: string | null;
  messageCount: number;
}) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {messageCount > 0
          ? `${messageCount} ${messageCount === 1 ? "message was" : "messages were"} attached to this report, but the transcript isn't available here.`
          : "No messages were attached to this report."}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {messages.map((message) => {
        const isReporter =
          Boolean(reporterId) && message.senderId === reporterId;
        return (
          <li
            key={message.id}
            className={cn(
              "flex flex-col gap-1 rounded-lg border p-3",
              !isReporter &&
                "border-red-200 bg-red-50/50 dark:border-red-500/30 dark:bg-red-500/5"
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">
                {message.senderName || "Unknown sender"}
              </span>
              {isReporter ? (
                <Badge variant="outline">Reporter</Badge>
              ) : (
                <Badge variant="destructive">Reported</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDateTime(message.sentAt)}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{message.body}</p>
          </li>
        );
      })}
    </ul>
  );
}
