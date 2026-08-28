import type { StatusTone } from "@/components/shared/status-badge";
import type {
  WalletTransactionDirection,
  WalletTransactionStatus,
  WalletTransactionType,
} from "@/features/wallet/types";

export const TRANSACTION_TYPE_OPTIONS: {
  value: WalletTransactionType;
  label: string;
  direction: WalletTransactionDirection;
}[] = [
  {
    value: "wallet_funding_bank",
    label: "Wallet Funding (Bank Transfer)",
    direction: "credit",
  },
  {
    value: "wallet_funding_card",
    label: "Wallet Funding (Debit Card)",
    direction: "credit",
  },
  { value: "p2p_send", label: "P2P Send", direction: "debit" },
  { value: "p2p_receive", label: "P2P Receive", direction: "credit" },
  {
    value: "external_transfer",
    label: "External Transfer",
    direction: "debit",
  },
  { value: "card_spend", label: "Card Spend", direction: "debit" },
];

export const TRANSACTION_TYPE_LABEL: Record<WalletTransactionType, string> =
  Object.fromEntries(
    TRANSACTION_TYPE_OPTIONS.map((option) => [option.value, option.label])
  ) as Record<WalletTransactionType, string>;

export const TRANSACTION_TYPE_DIRECTION: Record<
  WalletTransactionType,
  WalletTransactionDirection
> = Object.fromEntries(
  TRANSACTION_TYPE_OPTIONS.map((option) => [option.value, option.direction])
) as Record<WalletTransactionType, WalletTransactionDirection>;

/**
 * The status vocabulary each type can actually take. P2P Send / Receive reuse
 * the pending-transfer model designed for the banking sprint: a transfer isn't
 * simply "completed" — it can be pending acceptance, accepted, declined, or
 * auto-refunded after 24 hours.
 */
export const TRANSACTION_STATUSES_BY_TYPE: Record<
  WalletTransactionType,
  WalletTransactionStatus[]
> = {
  wallet_funding_bank: ["completed", "pending", "failed"],
  wallet_funding_card: ["completed", "failed"],
  p2p_send: ["pending", "accepted", "declined", "auto_refunded", "completed"],
  p2p_receive: [
    "pending",
    "accepted",
    "declined",
    "auto_refunded",
    "completed",
  ],
  external_transfer: ["completed", "pending", "failed"],
  card_spend: ["completed", "declined"],
};

export const TRANSACTION_STATUS_LABEL: Record<WalletTransactionStatus, string> =
  {
    completed: "Completed",
    pending: "Pending",
    failed: "Failed",
    accepted: "Accepted",
    declined: "Declined",
    auto_refunded: "Auto-Refunded",
  };

export const TRANSACTION_STATUS_TONE: Record<
  WalletTransactionStatus,
  StatusTone
> = {
  completed: "green",
  accepted: "green",
  pending: "amber",
  failed: "red",
  declined: "red",
  auto_refunded: "slate",
};

/** A settled transaction is one that actually moved money. */
export const SETTLED_STATUSES: WalletTransactionStatus[] = [
  "completed",
  "accepted",
];

export const TRANSACTIONS_PAGE_LIMIT = 10;
