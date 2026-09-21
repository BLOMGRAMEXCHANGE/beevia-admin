import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, humanizeToken } from "@/lib/format";
import type {
  ConversationParticipant,
  ConversationReport,
} from "@/features/chats/types";

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface ParticipantListProps {
  participants: ConversationParticipant[];
  createdBy: string | null;
  reports: ConversationReport[];
}

export function ConversationParticipants({
  participants,
  createdBy,
  reports,
}: ParticipantListProps) {
  if (participants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No participants on this conversation.
      </p>
    );
  }

  const reporterIds = new Set(
    reports.map((report) => report.reporterId).filter(Boolean)
  );

  return (
    <ul className="flex flex-col divide-y">
      {participants.map((participant) => (
        <li
          key={participant.userId || participant.joinedAt}
          className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
        >
          <Avatar className="size-8">
            <AvatarFallback>{initials(participant.name)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <div className="flex flex-wrap items-center gap-2">
              {participant.userId ? (
                <Link
                  href={`/users/${participant.userId}`}
                  className="font-medium hover:underline"
                >
                  {participant.name || "Unnamed user"}
                </Link>
              ) : (
                <span className="font-medium">
                  {participant.name || "Unnamed user"}
                </span>
              )}
              {participant.role !== "member" && (
                <Badge variant="secondary">
                  {humanizeToken(participant.role)}
                </Badge>
              )}
              {participant.userId && participant.userId === createdBy && (
                <Badge variant="outline">Creator</Badge>
              )}
              {participant.userId && reporterIds.has(participant.userId) && (
                <StatusBadge tone="amber">Reporter</StatusBadge>
              )}
              {participant.leftAt && (
                <StatusBadge tone="slate">Left</StatusBadge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              Joined {formatDate(participant.joinedAt)}
              {participant.leftAt &&
                ` · Left ${formatDate(participant.leftAt)}`}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
