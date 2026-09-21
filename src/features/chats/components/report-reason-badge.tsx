import { StatusBadge } from "@/components/shared/status-badge";
import {
  DEFAULT_REPORT_REASON_TONE,
  REPORT_REASON_TONE,
  isReasonCode,
} from "@/features/chats/constants";
import { cn } from "@/lib/utils";
import { humanizeToken } from "@/lib/format";

/**
 * A reason is either a code the app knows (`harassment`) or whatever the
 * reporter typed. Codes become badges; free text is shown as written, quoted,
 * so a sentence isn't mangled into Title Case and stuffed into a pill.
 */
export function ReportReasonBadge({
  reason,
  className,
}: {
  reason: string;
  className?: string;
}) {
  if (!reason) {
    return (
      <span className="text-sm text-muted-foreground">No reason given</span>
    );
  }

  if (!isReasonCode(reason)) {
    return (
      <span className={cn("text-sm", className)} title={reason}>
        &ldquo;{reason}&rdquo;
      </span>
    );
  }

  return (
    <StatusBadge
      tone={REPORT_REASON_TONE[reason] ?? DEFAULT_REPORT_REASON_TONE}
    >
      {humanizeToken(reason)}
    </StatusBadge>
  );
}
