"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AdminAccountApiError,
  useResendAdminInvite,
} from "@/features/admin-accounts/api";
import type { AdminAccount } from "@/types/admin";

const SENT_CONFIRMATION_MS = 4000;

export function ResendInviteButton({ account }: { account: AdminAccount }) {
  const [justSent, setJustSent] = useState(false);
  const { mutate, isPending } = useResendAdminInvite();

  function handleClick() {
    mutate(account.id, {
      onSuccess: () => {
        toast.success(`Invitation resent to ${account.email}.`);
        setJustSent(true);
        setTimeout(() => setJustSent(false), SENT_CONFIRMATION_MS);
      },
      onError: (mutationError) => {
        toast.error(
          mutationError instanceof AdminAccountApiError
            ? mutationError.message
            : "Something went wrong. Please try again."
        );
      },
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending || justSent}
    >
      {isPending ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          Sending…
        </>
      ) : justSent ? (
        "Sent"
      ) : (
        <>Re-invite</>
      )}
    </Button>
  );
}
