export type ConversationType = "direct" | "group";

export interface ConversationRecord {
  id: string;
  type: ConversationType;
  title: string | null;
  participantCount: number;
  messageCount: number;
  reportCount: number;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface ConversationParticipant {
  userId: string;
  name: string | null;
  role: string;
  joinedAt: string;
  leftAt: string | null;
}

export interface ConversationReport {
  id: string;
  reporterId: string | null;
  reporterName: string | null;
  reason: string;
  createdAt: string;
}

export interface ConversationDetail extends ConversationRecord {
  avatarUrl: string | null;
  createdBy: string | null;
  participants: ConversationParticipant[];
  reports: ConversationReport[];
}

export interface ChatsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ConversationsFilters {
  search?: string;
  type?: ConversationType;
  reportedOnly?: boolean;
}

export interface ChatUserRef {
  id: string;
  name: string | null;
}

export interface ChatBlockEntry {
  user: ChatUserRef;
  createdAt: string | null;
}

export interface UserChatActivity {
  user: ChatUserRef | null;
  conversations: ConversationRecord[];
  /** Users this account has blocked. */
  blocked: ChatBlockEntry[];
  /** Users who have blocked this account. */
  blockedBy: ChatBlockEntry[];
}

/** `pending` is where every report starts; the API rejects it as a decision,
 * so the three reviewable outcomes are kept in their own type. */
export type ReportDecision = "reviewed" | "actioned" | "dismissed";
export type ReportStatus = "pending" | ReportDecision;

export interface ReportReview {
  byId: string | null;
  byName: string | null;
  at: string | null;
  note: string | null;
}

export interface ReportConversationRef {
  id: string;
  type: ConversationType;
  title: string | null;
}

export interface ReportedMessage {
  id: string;
  messageId: string | null;
  senderId: string | null;
  senderName: string | null;
  body: string;
  sentAt: string;
}

export interface ReportRecord {
  id: string;
  reason: string;
  status: ReportStatus;
  /** How many messages the reporter attached as evidence. */
  messageCount: number;
  blockedContact: boolean;
  review: ReportReview | null;
  createdAt: string;
  conversation: ReportConversationRef | null;
  reporter: ChatUserRef | null;
}

export interface ReportDetail extends ReportRecord {
  participants: ConversationParticipant[];
  messages: ReportedMessage[];
}

export interface ReportsFilters {
  status?: ReportStatus;
}

export interface ReviewReportPayload {
  status: ReportDecision;
  note?: string;
}
