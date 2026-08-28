"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOverdueTransfers } from "@/features/pending-transfers/api";

/**
 * Persistent, cross-tab alert. The Pending Transfers tool exists so that an
 * overdue transfer — a concrete signal the 24-hour auto-refund job may be
 * failing — is never missed. Now that it sits behind a tab, this banner keeps
 * that signal visible from either tab.
 *
 * Renders nothing at all when no transfer is currently overdue (the calm
 * "all clear" state lives inside the Pending Transfers tab itself).
 */
export function OverdueAlertBanner({
  onJumpToPendingTransfers,
}: {
  onJumpToPendingTransfers: () => void;
}) {
  const { data } = useOverdueTransfers();
  const count = data?.length ?? 0;

  if (count === 0) return null;

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
    >
      <AlertTriangle className="size-5 shrink-0" />
      <p className="text-sm font-medium">
        {count} pending transfer{count === 1 ? " is" : "s are"} overdue — past
        the 24-hour auto-refund window.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="ml-auto border-red-300 bg-transparent text-red-800 hover:bg-red-100 dark:border-red-500/40 dark:text-red-200 dark:hover:bg-red-500/20"
        onClick={onJumpToPendingTransfers}
      >
        Review in Pending Transfers
      </Button>
    </div>
  );
}
