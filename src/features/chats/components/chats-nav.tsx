"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** Section nav for the chats module. Backed by routes rather than local state
 * so a report queue or a conversation list stays linkable and the browser's
 * back button lands where the admin expects. */
export function ChatsNav() {
  const router = useRouter();
  const pathname = usePathname();
  const value = pathname.startsWith("/chats/reports")
    ? "reports"
    : "conversations";

  return (
    <Tabs
      value={value}
      onValueChange={(next) =>
        router.push(next === "reports" ? "/chats/reports" : "/chats")
      }
    >
      <TabsList>
        <TabsTrigger value="conversations">Conversations</TabsTrigger>
        <TabsTrigger value="reports">Report queue</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
