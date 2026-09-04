import { StatusBadge } from "@/components/shared/status-badge";
import { humanizeToken } from "@/lib/format";
import {
  TRANSACTION_STATUS_LABEL,
  TRANSACTION_STATUS_TONE,
} from "@/features/transactions/constants";

export function TransactionStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge tone={TRANSACTION_STATUS_TONE[status] ?? "gray"}>
      {TRANSACTION_STATUS_LABEL[status] ?? humanizeToken(status)}
    </StatusBadge>
  );
}
