import { StatusBadge } from "@/components/shared/status-badge";
import {
  STATUS_LABEL,
  STATUS_TONE,
} from "@/features/pending-transfers/constants";
import type { PendingTransferStatus } from "@/features/pending-transfers/types";

export function TransferStatusBadge({
  status,
}: {
  status: PendingTransferStatus;
}) {
  return (
    <StatusBadge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</StatusBadge>
  );
}
