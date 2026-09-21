import type { StatusTone } from "@/components/shared/status-badge";
import type {
  ConversationType,
  ReportDecision,
  ReportStatus,
} from "@/features/chats/types";

export const CONVERSATION_TYPE_LABEL: Record<ConversationType, string> = {
  direct: "Direct",
  group: "Group",
};

export const CONVERSATION_TYPE_OPTIONS: {
  value: ConversationType;
  label: string;
}[] = [
  { value: "direct", label: "Direct" },
  { value: "group", label: "Group" },
];

/** Reason codes the backend sends today. The list is open-ended, so anything
 * not named here is still rendered (humanised) with the default tone. */
export const REPORT_REASON_TONE: Record<string, StatusTone> = {
  harassment: "red",
  hate_speech: "red",
  threats: "red",
  violence: "red",
  nudity: "red",
  csam: "red",
  fraud: "amber",
  scam: "amber",
  impersonation: "amber",
  spam: "amber",
  other: "gray",
};

export const DEFAULT_REPORT_REASON_TONE: StatusTone = "amber";

export const CONVERSATIONS_PAGE_LIMIT = 20;

/** Falls back to the short id so a direct chat (which has no title) still has
 * something recognisable in the table and on the detail header. */
export function conversationLabel(conversation: {
  title: string | null;
  type: ConversationType;
  id: string;
}): string {
  if (conversation.title) return conversation.title;
  return conversation.type === "direct"
    ? "Direct conversation"
    : "Untitled group";
}

export function shortId(id: string): string {
  return id.slice(0, 8);
}

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  pending: "Pending",
  reviewed: "Reviewed",
  actioned: "Actioned",
  dismissed: "Dismissed",
};

export const REPORT_STATUS_TONE: Record<ReportStatus, StatusTone> = {
  pending: "amber",
  reviewed: "blue",
  actioned: "green",
  dismissed: "slate",
};

export const REPORT_STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "actioned", label: "Actioned" },
  { value: "dismissed", label: "Dismissed" },
];

/** The wording matters: "reviewed" and "actioned" are different answers to
 * give a regulator, so the UI spells the difference out rather than leaving
 * it to the verb alone. */
export const REPORT_DECISIONS: {
  value: ReportDecision;
  label: string;
  description: string;
}[] = [
  {
    value: "reviewed",
    label: "Reviewed",
    description: "Looked at it — nothing needed doing.",
  },
  {
    value: "actioned",
    label: "Actioned",
    description: "Looked at it and took action against an account.",
  },
  {
    value: "dismissed",
    label: "Dismissed",
    description: "Not a genuine violation.",
  },
];

export const REPORTS_PAGE_LIMIT = 20;

export const REVIEW_NOTE_MAX_LENGTH = 2000;

/** Reasons arrive either as a code (`harassment`) or as whatever the reporter
 * typed ("Kept asking me to send money"). Only a code should be humanised into
 * a badge — free text is shown as the reporter wrote it. */
export function isReasonCode(reason: string): boolean {
  return /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(reason) && reason.length <= 32;
}
