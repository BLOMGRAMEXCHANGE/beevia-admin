import { Flag } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";

/** Zero reports reads as a quiet "Clean" rather than a loud 0 — the table is
 * scanned for trouble, so only reported chats should draw the eye. */
export function ReportCountBadge({ count }: { count: number }) {
  if (count === 0) {
    return <span className="text-sm text-muted-foreground">None</span>;
  }
  return (
    <StatusBadge tone="red">
      <Flag data-icon="inline-start" />
      {count} {count === 1 ? "report" : "reports"}
    </StatusBadge>
  );
}
