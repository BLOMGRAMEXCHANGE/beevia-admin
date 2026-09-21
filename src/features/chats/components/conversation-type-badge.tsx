import { MessageSquare, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CONVERSATION_TYPE_LABEL } from "@/features/chats/constants";
import type { ConversationType } from "@/features/chats/types";

export function ConversationTypeBadge({ type }: { type: ConversationType }) {
  const Icon = type === "group" ? Users : MessageSquare;
  return (
    <Badge variant="outline">
      <Icon data-icon="inline-start" />
      {CONVERSATION_TYPE_LABEL[type] ?? type}
    </Badge>
  );
}
