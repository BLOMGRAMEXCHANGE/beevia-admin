import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/features/users/components/verification-badge";
import { ACCOUNT_TYPE_LABEL } from "@/features/users/account-type";
import { formatDate } from "@/lib/format";
import type { UserRecord } from "@/types/user";

function initials(fullName: string | null | undefined): string {
  if (!fullName) return "?";
  return fullName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AccountHeader({ user }: { user: UserRecord }) {
  return (
    <div className="flex items-center gap-4">
      <Avatar size="lg">
        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
        <AvatarFallback>{initials(user.fullName)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {user.fullName || "Unnamed user"}
          </h1>
          <Badge variant="secondary">
            {ACCOUNT_TYPE_LABEL[user.accountType]}
          </Badge>
          <VerificationBadge status={user.verification} />
        </div>
        <p className="text-sm text-muted-foreground">
          {user.username} · Joined {formatDate(user.joinedAt)}
        </p>
      </div>
    </div>
  );
}
