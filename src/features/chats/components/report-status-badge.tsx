import { StatusBadge } from "@/components/shared/status-badge";
import {
  REPORT_STATUS_LABEL,
  REPORT_STATUS_TONE,
} from "@/features/chats/constants";
import { humanizeToken } from "@/lib/format";
import type { ReportStatus } from "@/features/chats/types";

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return (
    <StatusBadge tone={REPORT_STATUS_TONE[status] ?? "gray"}>
      {REPORT_STATUS_LABEL[status] ?? humanizeToken(status)}
    </StatusBadge>
  );
}
