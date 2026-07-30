"use client";

import { useSocketStatus } from "@/hooks/use-socket-status";
import { cn } from "@/lib/utils";

export function ConnectionStatus() {
  const connected = useSocketStatus();

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={cn(
          "size-2 rounded-full",
          connected ? "bg-emerald-500" : "bg-destructive"
        )}
      />
      {connected ? "Live" : "Reconnecting…"}
    </div>
  );
}
