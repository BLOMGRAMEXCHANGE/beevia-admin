import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/format";
import type { ChatBlockEntry } from "@/features/chats/types";

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

export function UserBlockList({
  entries,
  emptyMessage,
}: {
  entries: ChatBlockEntry[];
  emptyMessage: string;
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry) => (
        <li key={entry.user.id} className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback>{initials(entry.user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            {entry.user.id ? (
              <Link
                href={`/users/${entry.user.id}`}
                className="truncate text-sm font-medium hover:underline"
              >
                {entry.user.name || "Unnamed user"}
              </Link>
            ) : (
              <span className="truncate text-sm font-medium">
                {entry.user.name || "Unnamed user"}
              </span>
            )}
            {entry.createdAt && (
              <span className="text-xs text-muted-foreground">
                {formatDate(entry.createdAt)}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
