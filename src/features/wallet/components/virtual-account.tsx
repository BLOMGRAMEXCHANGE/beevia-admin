"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { WalletVirtualAccount } from "@/features/wallet/types";

/** Support staff read these account numbers out and paste them into other
 * systems constantly, so the number is monospaced (digit-by-digit legible)
 * and one click away from the clipboard. */
export function VirtualAccount({
  account,
  className,
}: {
  account: WalletVirtualAccount | null;
  className?: string;
}) {
  const [isCopied, setIsCopied] = useState(false);

  if (!account) {
    return (
      <span className="text-sm text-muted-foreground">Not issued yet</span>
    );
  }

  async function copy() {
    if (!account) return;
    try {
      await navigator.clipboard.writeText(account.accountNumber);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy the account number.");
    }
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-1">
        <span className="font-mono text-sm tabular-nums">
          {account.accountNumber}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Copy account number"
          onClick={(event) => {
            event.stopPropagation();
            void copy();
          }}
        >
          {isCopied ? (
            <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </Button>
      </div>
      {account.bankName && (
        <span className="text-xs text-muted-foreground">
          {account.bankName}
        </span>
      )}
    </div>
  );
}
