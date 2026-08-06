"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleGate } from "@/components/shared/role-gate";
import { useUserDetail } from "@/features/users/api";
import { AccountHeader } from "@/features/users/components/account-header";
import { ProfileInfo } from "@/features/users/components/profile-info";
import { OnboardingProgress } from "@/features/users/components/onboarding-progress";
import { WalletStatusSection } from "@/features/users/components/wallet-status-section";
import { KycPanel } from "@/features/users/components/kyc-panel";
import { SuspendReactivateDialog } from "@/features/users/components/suspend-reactivate-dialog";
import { CaseNotes } from "@/features/users/components/case-notes";
import { AuditTrail } from "@/features/users/components/audit-trail";

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
  const { data: user, isLoading, isError } = useUserDetail(userId);

  if (isLoading) {
    return <AccountDetailSkeleton />;
  }

  if (isError || !user) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="font-medium">User not found</p>
          <p className="text-sm text-muted-foreground">
            This account could not be loaded. It may not exist, or the request
            failed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <AccountHeader user={user} />
        <SuspendReactivateDialog user={user} />
      </div>

      <ProfileInfo user={user} />
      <OnboardingProgress user={user} />

      {user.accountType === "chat_banking" && (
        <WalletStatusSection user={user} />
      )}

      <RoleGate allow={["compliance", "super_admin"]}>
        <KycPanel user={user} />
      </RoleGate>

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
          <CardTitle className="font-heading text-base">Audit trail</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditTrail userId={userId} />
        </CardContent>
      </Card>
    </div>
  );
}
