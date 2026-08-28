import { StatusBadge } from "@/components/shared/status-badge";
import {
  TRANSACTION_STATUS_LABEL,
  TRANSACTION_STATUS_TONE,
} from "@/features/wallet/constants";
import type { WalletTransactionStatus } from "@/features/wallet/types";

export function TransactionStatusBadge({
  status,
}: {
  status: WalletTransactionStatus;
}) {
  return (
    <StatusBadge tone={TRANSACTION_STATUS_TONE[status]}>
      {TRANSACTION_STATUS_LABEL[status]}
    </StatusBadge>
  );
}
