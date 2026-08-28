"use client";

import { useCallback, useMemo, useState } from "react";
import { formatRelativeTime } from "@/lib/format";
import {
  MOCK_ACTIVITY,
  presentActivity,
  type ActivityEvent,
} from "@/features/dashboard/mock/activity";

export interface NotificationItem {
  id: string;
  line: string;
  href: string;
  icon: ReturnType<typeof presentActivity>["icon"];
  relativeTime: string;
  read: boolean;
}

function toNotification(event: ActivityEvent, read: boolean): NotificationItem {
  const presented = presentActivity(event);
  return {
    id: event.id,
    line: presented.line,
    href: presented.href,
    icon: presented.icon,
    relativeTime: formatRelativeTime(event.createdAt),
    read,
  };
}

/**
 * Mock notification feed for the header bell. Today it slices the same mock
 * activity events the Recent Activity feed uses.
 *
 * Socket swap later: replace the static `MOCK_ACTIVITY.slice(...)` seed with
 * state seeded from `GET /notifications`, and have the Socket.IO `notification`
 * handler call a `prepend(event)` updater. The returned shape
 * ({ notifications, unreadCount, markAllRead }) stays identical, so
 * NotificationBell does not change.
 */
export function useNotificationCenter(seedCount = 8) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const seed = useMemo(() => MOCK_ACTIVITY.slice(0, seedCount), [seedCount]);

  const notifications = useMemo(
    () => seed.map((event) => toNotification(event, readIds.has(event.id))),
    [seed, readIds]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setReadIds(new Set(seed.map((event) => event.id)));
  }, [seed]);

  return { notifications, unreadCount, markAllRead };
}
