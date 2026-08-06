import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/features/users/components/verification-badge";
import { ACCOUNT_TYPE_LABEL } from "@/features/users/account-type";
import { formatDate } from "@/lib/format";
import type { AppUser } from "@/types/user";

export function AccountHeader({ user }: { user: AppUser }) {
  return (
    <div className="flex items-center gap-4">
      <Avatar size="lg">
        <AvatarFallback className={`${user.avatarColor} text-white`}>
          {user.fullName
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {user.fullName}
          </h1>
          <Badge variant="secondary">
            {ACCOUNT_TYPE_LABEL[user.accountType]}
          </Badge>
          <VerificationBadge status={user.verification} />
        </div>
        <p className="text-sm text-muted-foreground">
          {user.username} · Joined {formatDate(user.createdAt)}
        </p>
      </div>
    </div>
  );
}
