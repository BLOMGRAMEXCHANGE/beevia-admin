"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserApiError, useUserDetail } from "@/features/users/api";
import { AccountHeader } from "@/features/users/components/account-header";
import { ProfileInfo } from "@/features/users/components/profile-info";
import { WalletSection } from "@/features/wallet/components/wallet-section";
import { UserStatusActions } from "@/features/users/components/user-status-actions";
import { CaseNotes } from "@/features/users/components/case-notes";
import { AuditTrail } from "@/features/users/components/audit-trail";
import { VerificationDetailPanel } from "@/features/users/components/verification-detail-panel";
import { ActionHistory } from "@/features/users/components/action-history";

function AccountDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export function AccountDetail({ userId }: { userId: string }) {
  const { data: user, isLoading, isError, error } = useUserDetail(userId);
  if (isLoading) {
    return <AccountDetailSkeleton />;
  }

  const isNotFound = error instanceof UserApiError && error.status === 404;

  if (isNotFound) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="font-medium">This user doesn&apos;t exist</p>
          <p className="text-sm text-muted-foreground">
            No account was found for this ID. It may have been deleted or the
            link may be incorrect.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isError || !user) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="font-medium">Something went wrong</p>
          <p className="text-sm text-muted-foreground">
            {error instanceof UserApiError
              ? error.message
              : "This account could not be loaded. Please try again."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <AccountHeader user={user} />
        <UserStatusActions user={user} />
      </div>

      <ProfileInfo user={user} />

      {user.accountType === "chat_banking" && <WalletSection userId={userId} />}

      <VerificationDetailPanel userId={userId} />

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Case notes</CardTitle>
        </CardHeader>
        <CardContent>
          <CaseNotes userId={userId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">
            Action history
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActionHistory userId={userId} />
        </CardContent>
      </Card>

      {/* <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Audit trail</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditTrail userId={userId} />
        </CardContent>
      </Card> */}
    </div>
  );
}
