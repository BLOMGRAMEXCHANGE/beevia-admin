"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ConnectionStatusDot,
  useConnectionStatus,
} from "@/components/shared/connection-status";
import { useNotificationCenter } from "@/features/dashboard/hooks/use-notification-center";

const CONNECTION_TEXT = {
  connected: "Connected",
  connecting: "Connecting…",
  disconnected: "Offline",
} as const;

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useNotificationCenter();
  const connection = useConnectionStatus();

  return (
    <DropdownMenu onOpenChange={(open) => open && markAllRead()}>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="relative" />}
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-4 min-w-4 justify-center px-1 text-[10px]">
            {unreadCount}
          </Badge>
        )}
        {/* Connection indicator — hardcoded "connected" for now, see useConnectionStatus. */}
        <ConnectionStatusDot className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-px" />
        <span className="sr-only">Notifications</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-90">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <span className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
            <ConnectionStatusDot />
            {CONNECTION_TEXT[connection]}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            No notifications yet
          </p>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              render={<Link href={notification.href} />}
              className="flex items-start gap-2.5"
            >
              <notification.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className="flex flex-col gap-0.5">
                <span
                  className={cn("text-sm", !notification.read && "font-medium")}
                >
                  {notification.line}
                </span>
                <span className="text-xs text-muted-foreground">
                  {notification.relativeTime}
                </span>
              </span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={<Link href="/dashboard" />}
          className="justify-center text-sm font-medium"
        >
          View all activity
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
