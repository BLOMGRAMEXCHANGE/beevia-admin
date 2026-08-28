"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useCurrentAdmin } from "@/hooks/use-current-admin";
import {
  AdminAccountApiError,
  useActiveSuperAdminCount,
  useUpdateAdminAccountStatus,
} from "@/features/admin-accounts/api";
import type { AdminAccount } from "@/types/admin";

export function DeactivateReactivateButton({
  account,
}: {
  account: AdminAccount;
}) {
  const [open, setOpen] = useState(false);
  const { data: currentAdmin } = useCurrentAdmin();
  const { data: activeSuperAdminCount } = useActiveSuperAdminCount();
  const { mutate, isPending } = useUpdateAdminAccountStatus();

  const isActive = account.status === "active";
  const isSelf = currentAdmin?.id === account.id;
  // Client-side only — see the TODO on useActiveSuperAdminCount in api.ts.
  const isLastActiveSuperAdmin =
    isActive && account.accessLevel === "full" && activeSuperAdminCount === 1;

  const disabledReason = isSelf
    ? "You cannot deactivate your own account."
    : isLastActiveSuperAdmin
      ? "Cannot deactivate the last active Super Admin."
      : null;

  const label = isActive ? "Deactivate" : "Activate";

  function handleConfirm() {
    mutate(
      { adminId: account.id, status: isActive ? "inactive" : "active" },
      {
        onSuccess: (result) => {
          toast.success(
            `${result.fullName}'s account is now ${result.status}.`
          );
          setOpen(false);
        },
        onError: (mutationError) => {
          if (
            mutationError instanceof AdminAccountApiError &&
            mutationError.status === 403
          ) {
            toast.error(
              mutationError.message ||
                "You do not have permission to perform this action."
            );
            return;
          }
          toast.error(
            mutationError instanceof Error
              ? mutationError.message
              : "Something went wrong. Please try again."
          );
        },
      }
    );
  }

  const buttonEl = (
    <Button
      variant={isActive ? "destructive" : "outline"}
      size="sm"
      disabled={Boolean(disabledReason)}
      className={cn(
        !isActive &&
          "border-transparent bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400"
      )}
    >
      {label}
    </Button>
  );

  if (disabledReason) {
    return (
      <Tooltip>
        {/* The button itself is pointer-events-none while disabled, so the
            wrapping span (not the button) is what actually receives hover. */}
        <TooltipTrigger render={<span tabIndex={0} className="inline-block" />}>
          {buttonEl}
        </TooltipTrigger>
        <TooltipContent>{disabledReason}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={buttonEl} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{label} admin account?</AlertDialogTitle>
          <AlertDialogDescription>
            {isActive
              ? `Deactivate ${account.fullName}'s account? They will lose access immediately.`
              : `Activate ${account.fullName}'s account? They will regain access immediately.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </AlertDialogClose>
          <Button
            variant={isActive ? "destructive" : "default"}
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? (isActive ? "Deactivating…" : "Activating…") : label}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
