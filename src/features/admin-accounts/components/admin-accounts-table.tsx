"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import {
  useAdminAccounts,
  useUpdateAdminRole,
} from "@/features/admin-accounts/api";
import { AccessLevelBadge } from "@/features/admin-accounts/components/access-level-badge";
import { AdminStatusBadge } from "@/features/admin-accounts/components/admin-status-badge";
import { DeactivateReactivateButton } from "@/features/admin-accounts/components/deactivate-reactivate-button";
import { InviteAdminDialog } from "@/features/admin-accounts/components/invite-admin-dialog";
import { ROLE_LABEL } from "@/lib/roles";
import { formatRelativeTime } from "@/lib/format";
import type {
  AdminAccessLevel,
  AdminAccount,
  AdminAccountStatus,
  AdminRole,
} from "@/types/admin";

type FilterValue<T extends string> = T | "all";

const ACCESS_LEVEL_OPTIONS: { value: AdminAccessLevel; label: string }[] = [
  { value: "full", label: "Full" },
  { value: "limited", label: "Limited" },
  { value: "read_only", label: "Read Only" },
];

const STATUS_OPTIONS: { value: AdminAccountStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function labelFor<T extends string>(
  options: { value: T; label: string }[],
  value: T
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

function RoleSelect({ account }: { account: AdminAccount }) {
  const { mutate, isPending } = useUpdateAdminRole();

  return (
    <Select
      value={account.role}
      disabled={isPending}
      onValueChange={(value) =>
        value && mutate({ id: account.id, role: value as AdminRole })
      }
    >
      <SelectTrigger size="sm" className="w-40">
        <SelectValue>{ROLE_LABEL[account.role]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(ROLE_LABEL).map(([role, label]) => (
          <SelectItem key={role} value={role}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function AdminAccountsTable() {
  const { data: accounts, isLoading } = useAdminAccounts();

  const [search, setSearch] = useState("");
  const [accessLevel, setAccessLevel] =
    useState<FilterValue<AdminAccessLevel>>("all");
  const [status, setStatus] = useState<FilterValue<AdminAccountStatus>>("all");

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (accounts ?? []).filter((account) => {
      if (query) {
        const haystack =
          `${account.name} ${account.username} ${ROLE_LABEL[account.role]}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (accessLevel !== "all" && account.accessLevel !== accessLevel)
        return false;
      if (status !== "all" && account.status !== status) return false;
      return true;
    });
  }, [accounts, search, accessLevel, status]);

  const columns: DataTableColumn<AdminAccount>[] = [
    {
      header: "Name",
      cell: (account) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="size-8">
            <AvatarFallback className={`${account.avatarColor} text-white`}>
              {account.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{account.name}</span>
            <span className="text-xs text-muted-foreground">
              {account.username}
            </span>
          </div>
        </div>
      ),
    },
    { header: "Role", cell: (account) => <RoleSelect account={account} /> },
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
      cell: (account) => formatRelativeTime(account.lastActiveAt),
    },
    {
      header: "Action",
      className: "text-right",
      cell: (account) => <DeactivateReactivateButton account={account} />,
    },
  ];

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
          <Badge variant="secondary">{(accounts ?? []).length}</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-56 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search role…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-8"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Select
                value={accessLevel}
                onValueChange={(value) =>
                  setAccessLevel(
                    (value as FilterValue<AdminAccessLevel>) ?? "all"
                  )
                }
              >
                <SelectTrigger size="sm">
                  <SelectValue>
                    {accessLevel === "all"
                      ? "Access Level"
                      : labelFor(ACCESS_LEVEL_OPTIONS, accessLevel)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All access levels</SelectItem>
                  {ACCESS_LEVEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus((value as FilterValue<AdminAccountStatus>) ?? "all")
                }
              >
                <SelectTrigger size="sm">
                  <SelectValue>
                    {status === "all"
                      ? "Status"
                      : labelFor(STATUS_OPTIONS, status)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredAccounts}
              getRowId={(account) => account.id}
              emptyMessage="No admin accounts match these filters."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
