import { StatusBadge } from "@/components/shared/status-badge";
import {
  WALLET_ACCOUNT_STATUS_LABEL,
  WALLET_ACCOUNT_STATUS_TONE,
} from "@/features/wallet/constants";
import { humanizeToken } from "@/lib/format";
import type { WalletAccountStatus } from "@/features/wallet/types";

export function WalletAccountStatusBadge({
  status,
}: {
  status: WalletAccountStatus;
}) {
  return (
    <StatusBadge tone={WALLET_ACCOUNT_STATUS_TONE[status] ?? "gray"}>
      {WALLET_ACCOUNT_STATUS_LABEL[status] ?? humanizeToken(status)}
    </StatusBadge>
  );
}
