import { ChatsNav } from "@/features/chats/components/chats-nav";

export function ChatsHeader({ description }: { description: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Chats
        </h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ChatsNav />
    </div>
  );
}
