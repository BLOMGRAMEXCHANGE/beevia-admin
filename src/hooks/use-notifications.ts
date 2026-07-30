"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSocket } from "@/providers/socket-provider";

export interface AppNotification {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  read: boolean;
}

function isNotificationPayload(
  payload: unknown
): payload is { id?: string; title: string; description?: string } {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "title" in payload &&
    typeof (payload as { title: unknown }).title === "string"
  );
}

export function useNotifications() {
  const { subscribe, unsubscribe } = useSocket();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    function handleNotification(payload: unknown) {
      if (!isNotificationPayload(payload)) return;

      const notification: AppNotification = {
        id: payload.id ?? crypto.randomUUID(),
        title: payload.title,
        description: payload.description,
        createdAt: new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      toast(notification.title, { description: notification.description });
    }

    subscribe("notification", handleNotification);
    return () => unsubscribe("notification", handleNotification);
  }, [subscribe, unsubscribe]);

  function pushNotification(
    notification: Omit<AppNotification, "id" | "createdAt" | "read">
  ) {
    setNotifications((prev) => [
      {
        ...notification,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, markAllRead, pushNotification };
}
