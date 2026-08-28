"use client";

import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { humanizeToken } from "@/lib/format";
import { UserApiError, useUserActionHistory } from "@/features/users/api";
import { useAdminAccounts } from "@/features/admin-accounts/api";
import { actionTypeLabel } from "@/features/users/action-history";

const ADMIN_LOOKUP_LIMIT = 100;

export function ActionHistory({ userId }: { userId: string }) {
  const {
    data: actions,
    isLoading,
    isError,
    error,
  } = useUserActionHistory(userId);

  const { data: adminAccountsData } = useAdminAccounts(1, ADMIN_LOOKUP_LIMIT);

  const adminNameById = new Map(
    (adminAccountsData?.accounts ?? []).map((admin) => [
      admin.id,
      admin.fullName,
    ])
  );

  const isNotFound = error instanceof UserApiError && error.status === 404;

  if (isLoading) {
    return <Skeleton className="h-16 w-full" />;
  }

  if (isNotFound) {
    return (
      <p className="text-sm text-muted-foreground">
        This user doesn&apos;t exist, so no action history could be loaded.
      </p>
    );
  }

  if (isError || !actions) {
    return (
      <p className="text-sm text-muted-foreground">
        {error instanceof UserApiError
          ? error.message
          : "Action history could not be loaded. Please try again."}
      </p>
    );
  }

  if (actions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No actions have been taken on this account
      </p>
    );
  }

  // Sorted explicitly client-side — API order isn't confirmed.
  const sortedActions = [...actions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <ul className="flex flex-col gap-2">
      {sortedActions.map((action) => (
        <li key={action.id} className="rounded-md border p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium">{actionTypeLabel(action.actionType)}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              {humanizeToken(action.previousStatus)}
              <ArrowRight className="size-3" />
              {humanizeToken(action.newStatus)}
            </p>
          </div>
          {action.reason && (
            <p className="text-muted-foreground">Reason: {action.reason}</p>
          )}
          {action.note && (
            <p className="text-muted-foreground">{action.note}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {adminNameById.get(action.adminId) ?? action.adminId} ·{" "}
            {new Date(action.createdAt).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}
