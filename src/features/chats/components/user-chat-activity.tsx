"use client";

import { useRouter } from "next/navigation";
import { MessageSquare, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { ConversationTypeBadge } from "@/features/chats/components/conversation-type-badge";
import { ReportCountBadge } from "@/features/chats/components/report-count-badge";
import { UserBlockList } from "@/features/chats/components/user-block-list";
import { ChatApiError, useUserChatActivity } from "@/features/chats/api";
import { conversationLabel, shortId } from "@/features/chats/constants";
import type { ConversationRecord } from "@/features/chats/types";
import { formatRelativeTime } from "@/lib/format";

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "red";
}) {
  return (
    <div className="flex flex-col">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          tone === "red" && value > 0
            ? "font-heading text-lg font-bold leading-tight text-red-600 dark:text-red-400"
            : "font-heading text-lg font-bold leading-tight"
        }
      >
        {value}
      </p>
    </div>
  );
}

export function UserChatActivity({ userId }: { userId: string }) {
  const router = useRouter();
  const { data, isLoading, isError, error } = useUserChatActivity(userId);

  const columns: DataTableColumn<ConversationRecord>[] = [
    {
      header: "Conversation",
      cell: (conversation) => (
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {conversation.type === "group" ? (
              <Users className="size-4" />
            ) : (
              <MessageSquare className="size-4" />
            )}
          </span>
          <div className="flex flex-col">
            <span className="font-medium">
              {conversationLabel(conversation)}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {shortId(conversation.id)}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Type",
      cell: (conversation) => (
        <ConversationTypeBadge type={conversation.type} />
      ),
    },
    {
      header: "Participants",
      cell: (conversation) => conversation.participantCount,
    },
    { header: "Messages", cell: (conversation) => conversation.messageCount },
    {
      header: "Reports",
      cell: (conversation) => (
        <ReportCountBadge count={conversation.reportCount} />
      ),
    },
    {
      header: "Last Message",
      cell: (conversation) =>
        conversation.lastMessageAt ? (
          formatRelativeTime(conversation.lastMessageAt)
        ) : (
          <span className="text-muted-foreground">No messages</span>
        ),
    },
  ];

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <CardTitle className="font-heading text-base">Chat activity</CardTitle>
        {data && data.blockedBy.length > 0 && (
          <StatusBadge tone="red">
            Blocked by {data.blockedBy.length}{" "}
            {data.blockedBy.length === 1 ? "user" : "users"}
          </StatusBadge>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isError || !data ? (
          <p className="text-sm text-muted-foreground">
            {error instanceof ChatApiError && error.status === 403
              ? error.message || "You do not have permission to view chats."
              : "Chat activity could not be loaded. Please try again."}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Metric label="Conversations" value={data.conversations.length} />
              <Metric
                label="Reports received"
                value={data.conversations.reduce(
                  (total, conversation) => total + conversation.reportCount,
                  0
                )}
                tone="red"
              />
              <Metric label="Users blocked" value={data.blocked.length} />
              {/* The signal that matters most for moderation: how many other
                  people have chosen to block this account. */}
              <Metric
                label="Blocked by"
                value={data.blockedBy.length}
                tone="red"
              />
            </div>

            <DataTable
              columns={columns}
              data={data.conversations}
              getRowId={(conversation) => conversation.id}
              emptyMessage="This user has no conversations."
              onRowClick={(conversation) =>
                router.push(`/chats/${conversation.id}`)
              }
            />

            <div className="grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">
                  Blocked by this user ({data.blocked.length})
                </p>
                <UserBlockList
                  entries={data.blocked}
                  emptyMessage="This user hasn't blocked anyone."
                />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">
                  Blocked this user ({data.blockedBy.length})
                </p>
                <UserBlockList
                  entries={data.blockedBy}
                  emptyMessage="No one has blocked this user."
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
