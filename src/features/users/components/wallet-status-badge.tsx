import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import type { WalletStatus } from "@/types/user";

const LABEL: Record<WalletStatus, string> = {
  none: "None",
  active: "Active",
  frozen: "Frozen",
  pending: "Pending",
};

const TONE: Record<WalletStatus, StatusTone> = {
  none: "gray",
  active: "green",
  frozen: "blue",
  pending: "amber",
};

export function WalletStatusBadge({ status }: { status: WalletStatus }) {
  return <StatusBadge tone={TONE[status]}>{LABEL[status]}</StatusBadge>;
}
