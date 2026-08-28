import { Loader2 } from "lucide-react";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import type { UserAccountStatus } from "@/types/user";

const STATUS_LABEL: Record<UserAccountStatus, string> = {
  active: "Active",
  restricted: "Restricted",
  suspended: "Suspended",
  deactivated: "Deactivated",
  deleting: "Deleting",
  deleted: "Deleted",
};

const STATUS_TONE: Record<UserAccountStatus, StatusTone> = {
  active: "green",
  restricted: "amber",
  suspended: "red",
  deactivated: "slate",
  deleting: "gray",
  deleted: "gray",
};

export function AccountStatusBadge({ status }: { status: UserAccountStatus }) {
  return (
    <StatusBadge tone={STATUS_TONE[status]}>
      {status === "deleting" && (
        <Loader2 className="size-3 animate-spin" data-icon="inline-start" />
      )}
      {STATUS_LABEL[status]}
    </StatusBadge>
  );
}
