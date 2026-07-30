"use client";

import { QueryProvider } from "@/providers/query-provider";
import { SocketProvider } from "@/providers/socket-provider";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SocketProvider>
        {children}
        <Toaster />
      </SocketProvider>
    </QueryProvider>
  );
}
