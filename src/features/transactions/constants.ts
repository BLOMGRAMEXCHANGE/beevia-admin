import type { StatusTone } from "@/components/shared/status-badge";

/**
 * Transaction types confirmed from the live `/admin/transactions` response.
 * Drives the Type filter's checkbox options. The backend may return other
 * values later — those still render fine via `humanizeToken` in the badge,
 * they just won't appear as a filter chip until added here.
 */
export const TRANSACTION_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "transfer", label: "Transfer" },
  { value: "withdrawal", label: "Withdrawal" },
  { value: "deposit", label: "Deposit" },
  { value: "fee", label: "Fee" },
];

export const TRANSACTION_TYPE_LABEL: Record<string, string> =
  Object.fromEntries(
    TRANSACTION_TYPE_OPTIONS.map((option) => [option.value, option.label])
  );

/**
 * Transaction statuses confirmed from the live response (only `completed` seen
 * so far). `pending` / `failed` are included as the two other outcomes a
 * financial transaction naturally has; extend/correct once confirmed.
 */
export const TRANSACTION_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
];

export const TRANSACTION_STATUS_LABEL: Record<string, string> =
  Object.fromEntries(
    TRANSACTION_STATUS_OPTIONS.map((option) => [option.value, option.label])
  );

export const TRANSACTION_STATUS_TONE: Record<string, StatusTone> = {
  completed: "green",
  pending: "amber",
  failed: "red",
};

export const TRANSACTIONS_PAGE_LIMIT = 20;
