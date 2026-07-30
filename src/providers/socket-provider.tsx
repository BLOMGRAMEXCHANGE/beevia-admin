"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { socketTransport, type SocketEventHandler } from "@/lib/socket";

interface SocketContextValue {
  connected: boolean;
  subscribe: (event: string, handler: SocketEventHandler) => void;
  unsubscribe: (event: string, handler: SocketEventHandler) => void;
  emit: (event: string, payload?: unknown) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const didConnect = useRef(false);

  useEffect(() => {
    if (didConnect.current) return;
    didConnect.current = true;

    const unsubscribeStatus = socketTransport.onStatusChange(setConnected);
    socketTransport.connect();

    return () => {
      unsubscribeStatus();
      socketTransport.disconnect();
    };
  }, []);

  const value: SocketContextValue = {
    connected,
    subscribe: (event, handler) => socketTransport.on(event, handler),
    unsubscribe: (event, handler) => socketTransport.off(event, handler),
    emit: (event, payload) => socketTransport.emit(event, payload),
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
