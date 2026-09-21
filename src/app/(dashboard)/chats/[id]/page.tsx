import { BackButton } from "@/components/shared/back-button";
import { ConversationDetail } from "@/features/chats/components/conversation-detail";

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <ConversationDetail conversationId={id} />
    </div>
  );
}
