import { StatusBadge } from "@/components/shared/status-badge";
import { humanizeToken } from "@/lib/format";
import { TRANSACTION_TYPE_LABEL } from "@/features/transactions/constants";
import type { TransactionDirection } from "@/features/transactions/types";

export function TransactionTypeBadge({
  type,
  direction,
}: {
  type: string;
  direction: TransactionDirection;
}) {
  return (
    <StatusBadge tone={direction === "credit" ? "green" : "slate"}>
      {TRANSACTION_TYPE_LABEL[type] ?? humanizeToken(type)}
    </StatusBadge>
  );
}
