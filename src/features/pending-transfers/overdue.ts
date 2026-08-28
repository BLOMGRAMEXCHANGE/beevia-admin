import { AUTO_REFUND_WINDOW_MS } from "@/features/pending-transfers/constants";
import type {
  DecoratedTransfer,
  PendingTransfer,
} from "@/features/pending-transfers/types";

/**
 * Decorates a transfer with time-based facts against a reference `now`.
 *
 * The overdue flag is a genuine conditional: a transfer is overdue ONLY when it
 * is still `pending` and more than 24 hours have elapsed since `createdAt`.
 * Resolved transfers are never overdue, and a pending transfer inside its
 * window is never overdue — nothing here is hardcoded to a particular row.
 */
export function decorateTransfer(
  transfer: PendingTransfer,
  now: number
): DecoratedTransfer {
  const createdMs = new Date(transfer.createdAt).getTime();
  const deadlineMs = createdMs + AUTO_REFUND_WINDOW_MS;
  const elapsed = now - createdMs;

  const isPending = transfer.status === "pending";
  const isOverdue = isPending && elapsed > AUTO_REFUND_WINDOW_MS;

  return {
    ...transfer,
    deadlineAt: new Date(deadlineMs).toISOString(),
    isOverdue,
    msUntilDeadline: isPending ? deadlineMs - now : null,
    msOverdue: isOverdue ? now - deadlineMs : null,
  };
}

export function decorateTransfers(
  transfers: PendingTransfer[],
  now: number
): DecoratedTransfer[] {
  return transfers.map((transfer) => decorateTransfer(transfer, now));
}

/** Rough, human-readable duration, e.g. "3 hours", "2 days", "45 minutes". */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  if (totalMinutes < 60) {
    return `${totalMinutes} minute${totalMinutes === 1 ? "" : "s"}`;
  }
  const totalHours = Math.round(totalMinutes / 60);
  if (totalHours < 48) {
    return `${totalHours} hour${totalHours === 1 ? "" : "s"}`;
  }
  const days = Math.round(totalHours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

/**
 * The "how far past / how far from the 24-hour window" label used in both the
 * overdue list and the detail view.
 */
export function windowLabel(transfer: DecoratedTransfer): string {
  if (transfer.status !== "pending") return "—";
  if (transfer.isOverdue && transfer.msOverdue !== null) {
    return `${formatDuration(transfer.msOverdue)} overdue`;
  }
  if (transfer.msUntilDeadline !== null) {
    return `${formatDuration(transfer.msUntilDeadline)} remaining`;
  }
  return "—";
}
