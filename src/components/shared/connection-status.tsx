"use client";

import { cn } from "@/lib/utils";

export type ConnectionState = "connected" | "connecting" | "disconnected";

/**
 * Real-time connection status for the header.
 *
 * For this pass the value is hardcoded to "connected" — there is no live
 * Socket.IO wiring yet. When the socket lands, this hook is the ONLY thing that
 * changes: subscribe to `socketTransport.onStatusChange` (or `useSocket()`)
 * here and return the real state. `ConnectionStatusDot` and the header layout
 * stay untouched.
 */
export function useConnectionStatus(): ConnectionState {
  // TODO(socket): return real state from useSocket()/socketTransport.
  return "connected";
}

const DOT_STYLES: Record<ConnectionState, string> = {
  connected: "bg-emerald-500",
  connecting: "bg-amber-500 animate-pulse",
  disconnected: "bg-muted-foreground/50",
};

const DOT_LABEL: Record<ConnectionState, string> = {
  connected: "Live — connected",
  connecting: "Connecting…",
  disconnected: "Offline — not connected",
};

export function ConnectionStatusDot({ className }: { className?: string }) {
  const state = useConnectionStatus();
  return (
    <span
      className={cn("inline-flex items-center", className)}
      title={DOT_LABEL[state]}
      role="status"
      aria-label={DOT_LABEL[state]}
    >
      <span className={cn("size-2 rounded-full", DOT_STYLES[state])} />
    </span>
  );
}
