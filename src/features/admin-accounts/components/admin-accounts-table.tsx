"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { PaginationControls } from "@/components/shared/pagination-controls";
import {
  AdminAccountApiError,
  useAdminAccounts,
} from "@/features/admin-accounts/api";
import { AccessLevelBadge } from "@/features/admin-accounts/components/access-level-badge";
import { AdminStatusBadge } from "@/features/admin-accounts/components/admin-status-badge";
import { DeactivateReactivateButton } from "@/features/admin-accounts/components/deactivate-reactivate-button";
import { InviteAdminDialog } from "@/features/admin-accounts/components/invite-admin-dialog";
import { ResendInviteButton } from "@/features/admin-accounts/components/resend-invite-button";
import {
  RoleApiError,
  useAssignAdminsToRole,
  useRoles,
} from "@/features/roles/api";
import { formatRelativeTime } from "@/lib/format";
import type { AdminAccount } from "@/types/admin";

const PAGE_LIMIT = 10;
const ROLE_SELECT_LIMIT = 100;

function RoleCell({ account }: { account: AdminAccount }) {
  const [pendingRole, setPendingRole] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [forbiddenError, setForbiddenError] = useState<string | null>(null);

  const { data: rolesData, isLoading: isLoadingRoles } = useRoles(
    1,
    ROLE_SELECT_LIMIT
  );
  const { mutate, isPending } = useAssignAdminsToRole();

  function handleValueChange(value: string | null) {
    if (!value || value === account.roleId) return;
    const role = rolesData?.roles.find((candidate) => candidate.id === value);
    if (!role) return;
    setForbiddenError(null);
    setPendingRole({ id: role.id, name: role.name });
  }

  function handleCancel() {
    if (isPending) return;
    setPendingRole(null);
  }

  function handleConfirm() {
    if (!pendingRole) return;
    mutate(
      { roleId: pendingRole.id, adminIds: [account.id] },
      {
        onSuccess: () => {
          toast.success(
            `${account.fullName}'s role changed to ${pendingRole.name}`
          );
          setPendingRole(null);
        },
        onError: (mutationError) => {
          if (
            mutationError instanceof RoleApiError &&
            mutationError.status === 403
          ) {
            setForbiddenError(
              mutationError.message ||
                "You do not have permission to perform this action."
            );
          } else {
            toast.error(
              mutationError instanceof RoleApiError
                ? mutationError.message
                : "Something went wrong. Please try again."
            );
          }
          setPendingRole(null);
        },
      }
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Select
          value={pendingRole ? pendingRole.id : account.roleId}
          onValueChange={handleValueChange}
          disabled={isLoadingRoles || isPending}
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue>
              {pendingRole ? pendingRole.name : account.roleName}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(rolesData?.roles ?? []).map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isPending && (
          <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />
        )}
      </div>
      {forbiddenError && (
        <p className="text-xs text-destructive">{forbiddenError}</p>
      )}

      <Dialog
        open={Boolean(pendingRole)}
        onOpenChange={(open) => !open && handleCancel()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-bold">Change role</DialogTitle>
            <DialogDescription>
              Change {account.fullName}&apos;s role to {pendingRole?.name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={isPending} />
              }
              onClick={handleCancel}
            >
              Cancel
            </DialogClose>
            <Button onClick={handleConfirm} disabled={isPending}>
              {isPending ? "Changing…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function initials(fullName: string): string {
  return fullName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AdminAccountsTable() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useAdminAccounts(
    page,
    PAGE_LIMIT
  );

  const columns: DataTableColumn<AdminAccount>[] = [
    {
      header: "Name",
      cell: (account) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="size-8">
            {account.avatarUrl && (
              <AvatarImage src={account.avatarUrl} alt="" />
            )}
            <AvatarFallback>{initials(account.fullName)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{account.fullName}</span>
            <span className="text-xs text-muted-foreground">
              {account.username}
            </span>
          </div>
        </div>
      ),
    },
    { header: "Email", cell: (account) => account.email },
    { header: "Role", cell: (account) => <RoleCell account={account} /> },
    {
      header: "Access Level",
      cell: (account) => <AccessLevelBadge level={account.accessLevel} />,
    },
    {
      header: "Status",
      cell: (account) => <AdminStatusBadge status={account.status} />,
    },
    {
      header: "Last Active",
      cell: (account) =>
        account.lastActiveAt
          ? formatRelativeTime(account.lastActiveAt)
          : "Never",
    },
    {
      header: "Action",
      className: "text-right",
      cell: (account) =>
        account.status === "invited" ? (
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-muted-foreground">
              Pending invite
            </span>
            <ResendInviteButton account={account} />
          </div>
        ) : (
          <DeactivateReactivateButton account={account} />
        ),
    },
  ];

  const isForbidden =
    isError && error instanceof AdminAccountApiError && error.status === 403;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Admin accounts &amp; roles
        </h1>
        <InviteAdminDialog />
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <CardTitle className="font-heading text-base">Admins</CardTitle>
          {data && <Badge variant="secondary">{data.meta.total}</Badge>}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isForbidden ? (
            <p className="text-sm text-muted-foreground">
              {(error as AdminAccountApiError).message ||
                "You do not have permission to view admin accounts."}
            </p>
          ) : isError ? (
            <p className="text-sm text-muted-foreground">
              Something went wrong loading admin accounts. Please try again.
            </p>
          ) : (
            <>
              <DataTable
                columns={columns}
                data={data?.accounts ?? []}
                getRowId={(account) => account.id}
                emptyMessage="No admin accounts found."
              />
              <PaginationControls
                page={data?.meta.currentPage ?? page}
                pageCount={data?.meta.totalPages ?? 1}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
