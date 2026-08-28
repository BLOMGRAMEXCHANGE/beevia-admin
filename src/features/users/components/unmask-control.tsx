"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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
import { useCurrentAdmin } from "@/hooks/use-current-admin";
import { UserApiError, useUnmaskVerificationCheck } from "@/features/users/api";
import { checkTypeLabel } from "@/features/users/verification";

export function UnmaskControl({
  userId,
  type,
  maskedValue,
}: {
  userId: string;
  type: string;
  maskedValue: string | null;
}) {
  const { hasPermission } = useCurrentAdmin();
  const [open, setOpen] = useState(false);

  const [unmaskedValue, setUnmaskedValue] = useState<string | null>(null);
  const { mutate, isPending } = useUnmaskVerificationCheck(userId, type);
  const label = checkTypeLabel(type);

  if (!hasPermission("kyc", "canView")) {
    return <span className="font-mono">{maskedValue ?? "—"}</span>;
  }

  if (unmaskedValue) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono">{unmaskedValue}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setUnmaskedValue(null)}
        >
          <EyeOff className="size-3.5" data-icon="inline-start" />
          Hide
        </Button>
      </div>
    );
  }

  function handleConfirm() {
    mutate(undefined, {
      onSuccess: (value) => {
        setUnmaskedValue(value);
        setOpen(false);
      },
      onError: (mutationError) => {
        toast.error(
          mutationError instanceof UserApiError
            ? mutationError.message
            : "Something went wrong. Please try again."
        );
        setOpen(false);
      },
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono">{maskedValue ?? "—"}</span>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger
          render={
            <Button type="button" variant="outline" size="sm">
              <Eye className="size-3.5" data-icon="inline-start" />
              Unmask
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>View unmasked {label}?</AlertDialogTitle>
            <AlertDialogDescription>
              View the unmasked {label} for this user? This may be logged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose
              render={<Button type="button" variant="outline" />}
            >
              Cancel
            </AlertDialogClose>
            <Button type="button" disabled={isPending} onClick={handleConfirm}>
              {isPending ? "Revealing…" : `Reveal ${label}`}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
