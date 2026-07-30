"use client";

import { Button } from "@/components/ui/button";
import { useUpdateUserStatus } from "@/features/users/api";
import type { AppUser } from "@/types/user";

export function SuspendReactivateButton({ user }: { user: AppUser }) {
  const { mutate, isPending } = useUpdateUserStatus(user.id);
  const isSuspended = user.status === "suspended";

  return (
    <Button
      variant={isSuspended ? "default" : "destructive"}
      disabled={isPending}
      onClick={() => mutate(isSuspended ? "active" : "suspended")}
    >
      {isPending
        ? "Updating…"
        : isSuspended
          ? "Reactivate account"
          : "Suspend account"}
    </Button>
  );
}
