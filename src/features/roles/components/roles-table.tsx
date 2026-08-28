"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { RoleApiError, useRoles } from "@/features/roles/api";
import { RoleStatusBadge } from "@/features/roles/components/role-status-badge";
import { RoleTypeBadge } from "@/features/roles/components/role-type-badge";
import { AccessLevelBadge } from "@/features/admin-accounts/components/access-level-badge";
import { formatDate } from "@/lib/format";
import type { RoleSummary } from "@/types/admin";

const PAGE_LIMIT = 10;

export function RolesTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useRoles(page, PAGE_LIMIT);

  const columns: DataTableColumn<RoleSummary>[] = [
    {
      header: "Name",
      cell: (role) => <span className="font-medium">{role.name}</span>,
    },
    { header: "Description", cell: (role) => role.description || "—" },
    { header: "Type", cell: (role) => <RoleTypeBadge type={role.type} /> },
    {
      header: "Status",
      cell: (role) => <RoleStatusBadge status={role.status} />,
    },
    { header: "Assigned Admins", cell: (role) => role.assignedAdminCount },
    {
      header: "Access Level",
      cell: (role) => <AccessLevelBadge level={role.accessLevel} />,
    },
    { header: "Last Updated", cell: (role) => formatDate(role.updatedAt) },
  ];

  const isForbidden =
    isError && error instanceof RoleApiError && error.status === 403;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Roles &amp; Permissions
        </h1>
        <Button onClick={() => router.push("/roles-permissions/new")}>
          Create Role
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <CardTitle className="font-heading text-base">Roles</CardTitle>
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
              {(error as RoleApiError).message ||
                "You do not have permission to view roles."}
            </p>
          ) : isError ? (
            <p className="text-sm text-muted-foreground">
              Something went wrong loading roles. Please try again.
            </p>
          ) : (
            <>
              <DataTable
                columns={columns}
                data={data?.roles ?? []}
                getRowId={(role) => role.id}
                emptyMessage="No roles found."
                onRowClick={(role) =>
                  router.push(`/roles-permissions/${role.id}/edit`)
                }
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
