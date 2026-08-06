"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useUserAuditTrail } from "@/features/users/api";
import { SUSPENSION_REASON_LABEL } from "@/features/users/suspension-reasons";

const ACTION_LABEL = {
  suspended: "Account suspended",
  reactivated: "Account reactivated",
};

export function AuditTrail({ userId }: { userId: string }) {
  const { data: entries, isLoading } = useUserAuditTrail(userId);

  if (isLoading) {
    return <Skeleton className="h-16 w-full" />;
  }

  if (!entries || entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No audit history yet.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry) => (
        <li key={entry.id} className="rounded-md border p-3 text-sm">
          <p className="font-medium">{ACTION_LABEL[entry.action]}</p>
          {entry.reason && (
            <p className="text-muted-foreground">
              Reason: {SUSPENSION_REASON_LABEL[entry.reason]}
            </p>
          )}
          {entry.note && <p className="text-muted-foreground">{entry.note}</p>}
          <p className="mt-1 text-xs text-muted-foreground">
            {entry.actingAdminName} ·{" "}
            {new Date(entry.createdAt).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}
