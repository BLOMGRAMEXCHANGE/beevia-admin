"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUpdateAdminStatus } from "@/features/admin-accounts/api";
import type { AdminAccount } from "@/types/admin";

export function DeactivateReactivateButton({
  account,
}: {
  account: AdminAccount;
}) {
  const { mutate, isPending } = useUpdateAdminStatus();
  const isActive = account.status === "active";

  return (
    <Button
      variant={isActive ? "destructive" : "outline"}
      size="sm"
      disabled={isPending}
      className={cn(
        !isActive &&
          "border-transparent bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400"
      )}
      onClick={() =>
        mutate({ id: account.id, status: isActive ? "inactive" : "active" })
      }
    >
      {isPending ? "Updating…" : isActive ? "Deactivate" : "Reactivate"}
    </Button>
  );
}
