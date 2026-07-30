import { io, type Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "";

export type SocketEventHandler = (...args: unknown[]) => void;

export interface SocketTransport {
  connect(): void;
  disconnect(): void;
  on(event: string, handler: SocketEventHandler): void;
  off(event: string, handler: SocketEventHandler): void;
  emit(event: string, payload?: unknown): void;
  onStatusChange(handler: (connected: boolean) => void): () => void;
}

function createSocketIOTransport(): SocketTransport {
  let socket: Socket | null = null;
  const statusHandlers = new Set<(connected: boolean) => void>();

  function notifyStatus(connected: boolean) {
    statusHandlers.forEach((handler) => handler(connected));
  }

  function ensureSocket(): Socket {
    if (!socket) {
      socket = io(SOCKET_URL, {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        withCredentials: true,
      });
      socket.on("connect", () => notifyStatus(true));
      socket.on("disconnect", () => notifyStatus(false));
      socket.on("reconnect", () => notifyStatus(true));
    }
    return socket;
  }

  return {
    connect() {
      ensureSocket().connect();
    },
    disconnect() {
      socket?.disconnect();
    },
    on(event, handler) {
      ensureSocket().on(event, handler);
    },
    off(event, handler) {
      socket?.off(event, handler);
    },
    emit(event, payload) {
      ensureSocket().emit(event, payload);
    },
    onStatusChange(handler) {
      statusHandlers.add(handler);
      return () => statusHandlers.delete(handler);
    },
  };
}

export const socketTransport: SocketTransport = createSocketIOTransport();
