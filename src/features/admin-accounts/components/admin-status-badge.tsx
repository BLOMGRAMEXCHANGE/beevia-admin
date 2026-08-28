import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import type { AdminAccountStatus } from "@/types/admin";

const LABEL: Record<AdminAccountStatus, string> = {
  active: "Active",
  invited: "Invited",
  inactive: "Inactive",
};

const TONE: Record<AdminAccountStatus, StatusTone> = {
  active: "green",
  invited: "amber",
  inactive: "red",
};

export function AdminStatusBadge({ status }: { status: AdminAccountStatus }) {
  return <StatusBadge tone={TONE[status]}>{LABEL[status]}</StatusBadge>;
}
