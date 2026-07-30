import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import type { VerificationStatus } from "@/types/user";

const LABEL: Record<VerificationStatus, string> = {
  verified: "Verified",
  pending: "Pending",
  failed: "Failed",
};

const TONE: Record<VerificationStatus, StatusTone> = {
  verified: "green",
  pending: "amber",
  failed: "red",
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  return <StatusBadge tone={TONE[status]}>{LABEL[status]}</StatusBadge>;
}
