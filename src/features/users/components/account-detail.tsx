"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountStatusBadge } from "@/features/users/components/account-status-badge";
import { SuspendReactivateButton } from "@/features/users/components/suspend-reactivate-button";
import { CaseNotes } from "@/features/users/components/case-notes";
import { useUserDetail } from "@/features/users/api";

export function AccountDetail({ userId }: { userId: string }) {
  const { data: user, isLoading } = useUserDetail(userId);

  if (isLoading || !user) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-heading">{user.fullName}</CardTitle>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <AccountStatusBadge status={user.status} />
            <SuspendReactivateButton user={user} />
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Phone</p>
            <p>{user.phone ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Member since</p>
            <p>{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Case notes</CardTitle>
        </CardHeader>
        <CardContent>
          <CaseNotes userId={userId} />
        </CardContent>
      </Card>
    </div>
  );
}
