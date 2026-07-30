import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import type { UserAccountStatus } from "@/types/user";

const STATUS_LABEL: Record<UserAccountStatus, string> = {
  active: "Active",
  restricted: "Restricted",
  suspended: "Suspended",
};

const STATUS_TONE: Record<UserAccountStatus, StatusTone> = {
  active: "green",
  restricted: "red",
  suspended: "gray",
};

export function AccountStatusBadge({ status }: { status: UserAccountStatus }) {
  return (
    <StatusBadge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</StatusBadge>
  );
}
