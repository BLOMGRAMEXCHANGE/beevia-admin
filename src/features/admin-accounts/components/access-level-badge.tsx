import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import type { AdminAccessLevel } from "@/types/admin";

const LABEL: Record<AdminAccessLevel, string> = {
  full: "Full",
  limited: "Limited",
  read_only: "Read Only",
};

const TONE: Record<AdminAccessLevel, StatusTone> = {
  full: "green",
  limited: "blue",
  read_only: "gray",
};

export function AccessLevelBadge({ level }: { level: AdminAccessLevel }) {
  return <StatusBadge tone={TONE[level]}>{LABEL[level]}</StatusBadge>;
}
