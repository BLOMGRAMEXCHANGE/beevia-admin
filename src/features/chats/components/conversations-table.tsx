"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, MessageSquare, Search, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { ChatsHeader } from "@/features/chats/components/chats-header";
import { ConversationTypeBadge } from "@/features/chats/components/conversation-type-badge";
import { ReportCountBadge } from "@/features/chats/components/report-count-badge";
import { ChatApiError, useConversationsList } from "@/features/chats/api";
import {
  CONVERSATIONS_PAGE_LIMIT,
  CONVERSATION_TYPE_LABEL,
  CONVERSATION_TYPE_OPTIONS,
  conversationLabel,
  shortId,
} from "@/features/chats/constants";
import type {
  ConversationRecord,
  ConversationType,
  ConversationsFilters,
} from "@/features/chats/types";
import { formatDate, formatRelativeTime } from "@/lib/format";

type TypeFilter = ConversationType | "all";
type Scope = "all" | "reported";

export function ConversationsTable() {
  const router = useRouter();

  const [scope, setScope] = useState<Scope>("all");
  const [rawSearch, setRawSearch] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [page, setPage] = useState(1);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function commitSearch(term: string) {
    setCommittedSearch(term.trim());
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setRawSearch(value);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => commitSearch(value), 500);
  }

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  function handleScopeChange(value: string) {
    setScope(value as Scope);
    setPage(1);
  }

  const hasActiveFilters = Boolean(committedSearch) || type !== "all";

  function clearFilters() {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setRawSearch("");
    setCommittedSearch("");
    setType("all");
    setPage(1);
  }

  const filters: ConversationsFilters = useMemo(
    () => ({
      search: committedSearch || undefined,
      type: type === "all" ? undefined : type,
      reportedOnly: scope === "reported" || undefined,
    }),
    [committedSearch, type, scope]
  );

  const { data, isLoading, isError, error } = useConversationsList(
    filters,
    page,
    CONVERSATIONS_PAGE_LIMIT
  );

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
    {
      header: "Messages",
      cell: (conversation) => conversation.messageCount,
    },
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
    {
      header: "Created",
      cell: (conversation) => formatDate(conversation.createdAt),
    },
  ];

  const isForbidden =
    isError && error instanceof ChatApiError && error.status === 403;

  const emptyMessage =
    scope === "reported"
      ? "No reported conversations. Nothing needs moderation right now."
      : "No conversations match these filters.";

  return (
    <div className="flex flex-col gap-6">
      <ChatsHeader description="Review conversations and the reports users have filed against them." />

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <CardTitle className="font-heading text-base">
            {scope === "reported" ? "Reported conversations" : "Conversations"}
          </CardTitle>
          {data && <Badge variant="secondary">{data.pagination.total}</Badge>}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-56 flex-1">
              <InputGroup>
                <InputGroupAddon>
                  <Search className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Search by title, participant, or conversation ID"
                  value={rawSearch}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      if (debounceTimerRef.current) {
                        clearTimeout(debounceTimerRef.current);
                      }
                      commitSearch(rawSearch);
                    }
                  }}
                />
              </InputGroup>
            </div>

            <Select
              value={type}
              onValueChange={(value: TypeFilter | null) => {
                setType(value ?? "all");
                setPage(1);
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue>
                  {type === "all" ? "Type" : CONVERSATION_TYPE_LABEL[type]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {CONVERSATION_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={scope === "reported" ? "secondary" : "outline"}
              size="sm"
              aria-pressed={scope === "reported"}
              onClick={() =>
                handleScopeChange(scope === "reported" ? "all" : "reported")
              }
            >
              <Flag data-icon="inline-start" className="size-4" />
              Reported only
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X data-icon="inline-start" className="size-4" />
                Clear filters
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : isForbidden ? (
            <p className="text-sm text-muted-foreground">
              {(error as ChatApiError).message ||
                "You do not have permission to view chats."}
            </p>
          ) : isError ? (
            <p className="text-sm text-muted-foreground">
              Something went wrong loading conversations. Please try again.
            </p>
          ) : (
            <>
              <DataTable
                columns={columns}
                data={data?.conversations ?? []}
                getRowId={(conversation) => conversation.id}
                emptyMessage={emptyMessage}
                onRowClick={(conversation) =>
                  router.push(`/chats/${conversation.id}`)
                }
              />
              <PaginationControls
                page={data?.pagination.page ?? page}
                pageCount={data?.pagination.totalPages ?? 1}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
