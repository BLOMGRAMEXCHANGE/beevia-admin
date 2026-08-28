import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { checkStatusLabel } from "@/features/users/verification";

const CHECK_STATUS_TONE: Record<string, StatusTone> = {
  verified: "green",
  failed: "red",
  not_started: "gray",
  pending: "amber",
};

export function CheckStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge tone={CHECK_STATUS_TONE[status] ?? "gray"}>
      {checkStatusLabel(status)}
    </StatusBadge>
  );
}
