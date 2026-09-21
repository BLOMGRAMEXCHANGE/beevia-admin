import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { liveClient } from "@/lib/api-client";
import type {
  ChatBlockEntry,
  ChatsPagination,
  ConversationDetail,
  ConversationParticipant,
  ConversationRecord,
  ConversationReport,
  ConversationType,
  ConversationsFilters,
  ReportDetail,
  ReportRecord,
  ReportReview,
  ReportStatus,
  ReportedMessage,
  ReportsFilters,
  ReviewReportPayload,
  UserChatActivity,
} from "@/features/chats/types";

export class ChatApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

function toChatApiError(error: unknown): ChatApiError {
  if (isAxiosError<{ message?: string }>(error)) {
    return new ChatApiError(
      error.response?.data?.message ?? "Something went wrong.",
      error.response?.status
    );
  }
  return new ChatApiError("Something went wrong.");
}

interface ConversationData {
  id: string;
  type: ConversationType;
  title: string | null;
  participant_count: number;
  message_count: number;
  report_count: number;
  last_message_at: string | null;
  created_at: string;
}

interface ParticipantData {
  user: { id: string; name: string | null } | null;
  role: string;
  joined_at: string;
  left_at: string | null;
}

/** The trimmed report shape embedded in a conversation detail — distinct
 * from the standalone `ReportData` the report queue returns. */
interface ConversationReportData {
  id: string;
  reporter: { id: string; name: string | null } | null;
  reason: string;
  created_at: string;
}

interface ConversationDetailData extends ConversationData {
  avatar_url: string | null;
  created_by: string | null;
  participants: ParticipantData[] | null;
  reports: ConversationReportData[] | null;
}

function toConversationRecord(data: ConversationData): ConversationRecord {
  return {
    id: data.id,
    type: data.type,
    title: data.title,
    participantCount: data.participant_count ?? 0,
    messageCount: data.message_count ?? 0,
    reportCount: data.report_count ?? 0,
    lastMessageAt: data.last_message_at,
    createdAt: data.created_at,
  };
}

function toParticipant(data: ParticipantData): ConversationParticipant {
  return {
    userId: data.user?.id ?? "",
    name: data.user?.name ?? null,
    role: data.role ?? "member",
    joinedAt: data.joined_at,
    leftAt: data.left_at,
  };
}

function toReport(data: ConversationReportData): ConversationReport {
  return {
    id: data.id,
    reporterId: data.reporter?.id ?? null,
    reporterName: data.reporter?.name ?? null,
    reason: data.reason,
    createdAt: data.created_at,
  };
}

function toConversationDetail(
  data: ConversationDetailData
): ConversationDetail {
  return {
    ...toConversationRecord(data),
    avatarUrl: data.avatar_url ?? null,
    createdBy: data.created_by ?? null,
    participants: (data.participants ?? []).map(toParticipant),
    reports: (data.reports ?? []).map(toReport),
  };
}

interface ConversationsListResponse {
  data: {
    conversations: ConversationData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
}

export function useConversationsList(
  filters: ConversationsFilters,
  page: number,
  limit: number
) {
  return useQuery({
    queryKey: ["chats", "list", filters, page, limit],
    queryFn: async () => {
      try {
        const { data } = await liveClient.get<ConversationsListResponse>(
          "/admin/chats",
          {
            params: {
              page,
              limit,
              search: filters.search,
              type: filters.type,
              // Only sent when narrowing to reported chats — an explicit
              // `false` would be redundant and keeps the URL noisy.
              reportedOnly: filters.reportedOnly ? true : undefined,
            },
          }
        );
        const pagination: ChatsPagination = {
          page: data.data.pagination.page,
          limit: data.data.pagination.limit,
          total: data.data.pagination.total,
          totalPages: data.data.pagination.total_pages,
        };
        return {
          conversations: (data.data.conversations ?? []).map(
            toConversationRecord
          ),
          pagination,
        };
      } catch (error) {
        throw toChatApiError(error);
      }
    },
    placeholderData: keepPreviousData,
  });
}

export function useConversationDetail(conversationId: string) {
  return useQuery({
    queryKey: ["chats", "detail", conversationId],
    queryFn: async () => {
      try {
        const { data } = await liveClient.get<{ data: ConversationDetailData }>(
          `/admin/chats/${conversationId}`
        );
        return toConversationDetail(data.data);
      } catch (error) {
        throw toChatApiError(error);
      }
    },
    enabled: Boolean(conversationId),
    retry: false,
  });
}

/** Both block arrays came back empty on the sample response, so the entry
 * shape isn't confirmed. This accepts either a bare user ({id, name}) or a
 * wrapper ({user: {...}, created_at/blocked_at}) and normalises both. */
interface BlockEntryData {
  id?: string;
  name?: string | null;
  user?: { id: string; name: string | null } | null;
  created_at?: string | null;
  blocked_at?: string | null;
}

function toBlockEntry(data: BlockEntryData): ChatBlockEntry {
  const user = data.user ?? { id: data.id ?? "", name: data.name ?? null };
  return {
    user: { id: user.id ?? "", name: user.name ?? null },
    createdAt: data.created_at ?? data.blocked_at ?? null,
  };
}

interface UserChatActivityData {
  user: { id: string; name: string | null } | null;
  conversations: ConversationData[] | null;
  blocked: BlockEntryData[] | null;
  blocked_by: BlockEntryData[] | null;
}

export function useUserChatActivity(userId: string) {
  return useQuery({
    queryKey: ["chats", "user", userId],
    queryFn: async () => {
      try {
        const { data } = await liveClient.get<{ data: UserChatActivityData }>(
          `/admin/chats/users/${userId}`
        );
        const activity: UserChatActivity = {
          user: data.data.user
            ? {
                id: data.data.user.id,
                name: data.data.user.name ?? null,
              }
            : null,
          conversations: (data.data.conversations ?? []).map(
            toConversationRecord
          ),
          blocked: (data.data.blocked ?? []).map(toBlockEntry),
          blockedBy: (data.data.blocked_by ?? []).map(toBlockEntry),
        };
        return activity;
      } catch (error) {
        throw toChatApiError(error);
      }
    },
    enabled: Boolean(userId),
    retry: false,
  });
}

interface ReportReviewData {
  by?: { id: string; name: string | null } | null;
  at?: string | null;
  note?: string | null;
}

interface ReportData {
  id: string;
  reason: string;
  status: ReportStatus;
  message_count: number;
  blocked_contact: boolean;
  review: ReportReviewData | null;
  created_at: string;
  conversation: {
    id: string;
    type: ConversationType;
    title: string | null;
  } | null;
  reporter: { id: string; name: string | null } | null;
  participants?: ParticipantData[] | null;
  messages?: ReportedMessageData[] | null;
}

interface ReportedMessageData {
  id: string;
  message_id: string | null;
  sender: { id: string; name: string | null } | null;
  body: string;
  sent_at: string;
}

function toReportReview(data: ReportReviewData | null): ReportReview | null {
  if (!data) return null;
  return {
    byId: data.by?.id ?? null,
    byName: data.by?.name ?? null,
    at: data.at ?? null,
    note: data.note ?? null,
  };
}

function toReportedMessage(data: ReportedMessageData): ReportedMessage {
  return {
    id: data.id,
    messageId: data.message_id ?? null,
    senderId: data.sender?.id ?? null,
    senderName: data.sender?.name ?? null,
    body: data.body ?? "",
    sentAt: data.sent_at,
  };
}

function toReportRecord(data: ReportData): ReportRecord {
  return {
    id: data.id,
    reason: data.reason ?? "",
    status: data.status,
    messageCount: data.message_count ?? 0,
    blockedContact: Boolean(data.blocked_contact),
    review: toReportReview(data.review ?? null),
    createdAt: data.created_at,
    conversation: data.conversation
      ? {
          id: data.conversation.id,
          type: data.conversation.type,
          title: data.conversation.title ?? null,
        }
      : null,
    reporter: data.reporter
      ? { id: data.reporter.id, name: data.reporter.name ?? null }
      : null,
  };
}

function toReportDetail(data: ReportData): ReportDetail {
  return {
    ...toReportRecord(data),
    participants: (data.participants ?? []).map(toParticipant),
    messages: (data.messages ?? []).map(toReportedMessage),
  };
}

interface ReportsListResponse {
  data: {
    reports: ReportData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
}

export function useReportsQueue(
  filters: ReportsFilters,
  page: number,
  limit: number
) {
  return useQuery({
    queryKey: ["chats", "reports", "list", filters, page, limit],
    queryFn: async () => {
      try {
        const { data } = await liveClient.get<ReportsListResponse>(
          "/admin/chats/reports",
          { params: { page, limit, status: filters.status } }
        );
        const pagination: ChatsPagination = {
          page: data.data.pagination.page,
          limit: data.data.pagination.limit,
          total: data.data.pagination.total,
          totalPages: data.data.pagination.total_pages,
        };
        return {
          reports: (data.data.reports ?? []).map(toReportRecord),
          pagination,
        };
      } catch (error) {
        throw toChatApiError(error);
      }
    },
    placeholderData: keepPreviousData,
  });
}

/**
 * TODO(backend): the documented sample for `GET /admin/chats/reports/{id}`
 * echoes the *list* envelope (`{ reports: [...], pagination }`), while the
 * review endpoint documents the real detail shape (a bare report with
 * `participants` and `messages`). Both are unwrapped here so the UI works
 * either way — drop the list branch once the endpoint is confirmed.
 */
function unwrapReportDetail(payload: unknown): ReportData {
  const data = (payload as { data?: unknown }).data;
  const listed = (data as { reports?: ReportData[] } | null)?.reports;
  if (Array.isArray(listed)) {
    if (listed.length === 0) {
      throw new ChatApiError("Report not found.", 404);
    }
    return listed[0];
  }
  return data as ReportData;
}

export function useReportDetail(reportId: string) {
  return useQuery({
    queryKey: ["chats", "reports", "detail", reportId],
    queryFn: async () => {
      try {
        const { data } = await liveClient.get(
          `/admin/chats/reports/${reportId}`
        );
        return toReportDetail(unwrapReportDetail(data));
      } catch (error) {
        if (error instanceof ChatApiError) throw error;
        throw toChatApiError(error);
      }
    },
    enabled: Boolean(reportId),
    retry: false,
  });
}

export function useReviewReport(reportId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ReviewReportPayload) => {
      try {
        const { data } = await liveClient.patch(
          `/admin/chats/reports/${reportId}`,
          {
            status: payload.status,
            // Sent even when empty: the API treats an omitted note as "clear
            // the previous one", so leaving it out silently would be a
            // different action than the reviewer intends.
            note: payload.note ?? "",
          }
        );
        return toReportDetail(unwrapReportDetail(data));
      } catch (error) {
        throw toChatApiError(error);
      }
    },
    onSuccess: (report) => {
      queryClient.setQueryData(
        ["chats", "reports", "detail", reportId],
        report
      );
      // The queue is filtered by status, so a decision moves the report out of
      // (or into) whichever list is on screen.
      queryClient.invalidateQueries({ queryKey: ["chats", "reports", "list"] });
      if (report.conversation) {
        queryClient.invalidateQueries({
          queryKey: ["chats", "detail", report.conversation.id],
        });
      }
    },
  });
}
