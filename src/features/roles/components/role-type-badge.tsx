import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import type { RoleSummary } from "@/types/admin";

const LABEL: Record<RoleSummary["type"], string> = {
  system: "System",
  custom: "Custom",
};

const TONE: Record<RoleSummary["type"], StatusTone> = {
  system: "blue",
  custom: "gray",
};

export function RoleTypeBadge({ type }: { type: RoleSummary["type"] }) {
  return <StatusBadge tone={TONE[type]}>{LABEL[type]}</StatusBadge>;
}
