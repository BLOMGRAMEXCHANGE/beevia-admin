"use client";

import { QueryProvider } from "@/providers/query-provider";
import { SocketProvider } from "@/providers/socket-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SocketProvider>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </SocketProvider>
    </QueryProvider>
  );
}
