import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import type { RoleSummary } from "@/types/admin";

const LABEL: Record<RoleSummary["status"], string> = {
  active: "Active",
  inactive: "Inactive",
};

const TONE: Record<RoleSummary["status"], StatusTone> = {
  active: "green",
  inactive: "red",
};

export function RoleStatusBadge({ status }: { status: RoleSummary["status"] }) {
  return <StatusBadge tone={TONE[status]}>{LABEL[status]}</StatusBadge>;
}
