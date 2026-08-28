import type { StatusTone } from "@/components/shared/status-badge";
import type {
  PendingTransferKind,
  PendingTransferStatus,
  ResolutionMethod,
} from "@/features/pending-transfers/types";

/** The window a recipient has to Accept or Decline before an auto-refund fires. */
export const AUTO_REFUND_WINDOW_HOURS = 24;
export const AUTO_REFUND_WINDOW_MS = AUTO_REFUND_WINDOW_HOURS * 60 * 60 * 1000;

export const STATUS_LABEL: Record<PendingTransferStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  auto_refunded: "Auto-Refunded",
};

export const STATUS_TONE: Record<PendingTransferStatus, StatusTone> = {
  pending: "amber",
  accepted: "green",
  declined: "slate",
  auto_refunded: "blue",
};

export const KIND_LABEL: Record<PendingTransferKind, string> = {
  free_will_send: "Free-will send",
  mismatched_fulfillment: "Mismatched request fulfillment",
};

export const RESOLUTION_LABEL: Record<ResolutionMethod, string> = {
  accepted_by_recipient: "Accepted by recipient",
  declined_by_recipient: "Declined by recipient",
  auto_refunded_timeout: "Auto-refunded after 24-hour timeout",
};

export const SEARCH_PAGE_LIMIT = 15;
