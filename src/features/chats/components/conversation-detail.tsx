"use client";

import Link from "next/link";
import { Flag, MessageSquare, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversationTypeBadge } from "@/features/chats/components/conversation-type-badge";
import { ConversationParticipants } from "@/features/chats/components/conversation-participants";
import { ConversationReports } from "@/features/chats/components/conversation-reports";
import { ChatApiError, useConversationDetail } from "@/features/chats/api";
import { conversationLabel, shortId } from "@/features/chats/constants";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime } from "@/lib/format";

function ConversationDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="flex flex-col">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-heading text-lg font-bold leading-tight">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p>{value}</p>
    </div>
  );
}

export function ConversationDetail({
  conversationId,
}: {
  conversationId: string;
}) {
  const {
    data: conversation,
    isLoading,
    isError,
    error,
  } = useConversationDetail(conversationId);

  if (isLoading) {
    return <ConversationDetailSkeleton />;
  }

  if (error instanceof ChatApiError && error.status === 404) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="font-medium">This conversation doesn&apos;t exist</p>
          <p className="text-sm text-muted-foreground">
            No conversation was found for this ID. It may have been deleted or
            the link may be incorrect.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isError || !conversation) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="font-medium">Something went wrong</p>
          <p className="text-sm text-muted-foreground">
            {error instanceof ChatApiError
              ? error.message
              : "This conversation could not be loaded. Please try again."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const label = conversationLabel(conversation);
  const creator = conversation.participants.find(
    (participant) => participant.userId === conversation.createdBy
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Avatar size="lg">
          {conversation.avatarUrl && (
            <AvatarImage src={conversation.avatarUrl} alt="" />
          )}
          <AvatarFallback>
            {conversation.type === "group" ? (
              <Users className="size-4" />
            ) : (
              <MessageSquare className="size-4" />
            )}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              {label}
            </h1>
            <ConversationTypeBadge type={conversation.type} />
            {conversation.reportCount > 0 && (
              <StatusBadge tone="red">
                <Flag data-icon="inline-start" />
                {conversation.reportCount}{" "}
                {conversation.reportCount === 1 ? "report" : "reports"}
              </StatusBadge>
            )}
          </div>
          <p className="font-mono text-sm text-muted-foreground">
            {conversation.id}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat
            icon={Users}
            label="Participants"
            value={String(conversation.participantCount)}
          />
          <Stat
            icon={MessageSquare}
            label="Messages"
            value={String(conversation.messageCount)}
            hint={
              conversation.lastMessageAt
                ? `Last ${formatDateTime(conversation.lastMessageAt)}`
                : "No messages yet"
            }
          />
          <Stat
            icon={Flag}
            label="Reports"
            value={String(conversation.reportCount)}
            hint={
              conversation.reportCount > 0
                ? "Needs moderation review"
                : "No reports filed"
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <CardTitle className="font-heading text-base">
            Reports ({conversation.reports.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ConversationReports reports={conversation.reports} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">
            Participants ({conversation.participants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ConversationParticipants
            participants={conversation.participants}
            createdBy={conversation.createdBy}
            reports={conversation.reports}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">
            Conversation details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <Field label="Conversation ID" value={shortId(conversation.id)} />
          <Field label="Title" value={conversation.title ?? "None"} />
          <Field
            label="Created"
            value={formatDateTime(conversation.createdAt)}
          />
          <Field
            label="Last message"
            value={
              conversation.lastMessageAt
                ? formatDateTime(conversation.lastMessageAt)
                : "No messages"
            }
          />
          <div>
            <p className="text-muted-foreground">Created by</p>
            {conversation.createdBy ? (
              <Link
                href={`/users/${conversation.createdBy}`}
                className="hover:underline"
              >
                {creator?.name || `User ${shortId(conversation.createdBy)}`}
              </Link>
            ) : (
              <p>Unknown</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
