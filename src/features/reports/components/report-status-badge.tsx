import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import type { ReportStatus } from "@/features/reports/types";

const TONE: Record<ReportStatus, StatusTone> = {
  queued: "amber",
  running: "amber",
  ready: "green",
  failed: "red",
};

const LABEL: Record<ReportStatus, string> = {
  queued: "Queued",
  running: "Generating",
  ready: "Ready",
  failed: "Failed",
};

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return <StatusBadge tone={TONE[status]}>{LABEL[status]}</StatusBadge>;
}
