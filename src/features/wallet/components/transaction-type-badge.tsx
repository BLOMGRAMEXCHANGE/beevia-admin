import { StatusBadge } from "@/components/shared/status-badge";
import {
  TRANSACTION_TYPE_DIRECTION,
  TRANSACTION_TYPE_LABEL,
} from "@/features/wallet/constants";
import type { WalletTransactionType } from "@/features/wallet/types";

export function TransactionTypeBadge({
  type,
}: {
  type: WalletTransactionType;
}) {
  return (
    <StatusBadge
      tone={TRANSACTION_TYPE_DIRECTION[type] === "credit" ? "green" : "slate"}
    >
      {TRANSACTION_TYPE_LABEL[type]}
    </StatusBadge>
  );
}
