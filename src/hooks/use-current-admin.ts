import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStoredAdmin } from "@/lib/token-store";
import { useRole } from "@/features/roles/api";
import type {
  PermissionAction,
  PermissionModule,
} from "@/features/roles/constants";
import {
  permissionResponseToMatrix,
  type PermissionMatrixState,
} from "@/features/roles/types";
import type { CurrentAdmin } from "@/types/admin";

export type CurrentAdminPermissions = PermissionMatrixState;

async function fetchCurrentAdmin(): Promise<CurrentAdmin> {
  const admin = getStoredAdmin();
  if (!admin) throw new Error("Not signed in");
  return admin;
}

export function useCurrentAdmin() {
  const adminQuery = useQuery({
    queryKey: ["current-admin"],
    queryFn: fetchCurrentAdmin,
    staleTime: Infinity,
    retry: false,
  });

  const roleId = adminQuery.data?.roleId;
  const roleQuery = useRole(roleId ?? "");

  const permissionsReady = Boolean(roleId) && roleQuery.isSuccess;
  const permissions: CurrentAdminPermissions | null = permissionsReady
    ? permissionResponseToMatrix(roleQuery.data!.permissions)
    : null;

  const hasPermission = useCallback(
    (module: PermissionModule, action: PermissionAction): boolean => {
      return permissions?.[module]?.[action] ?? false;
    },
    [permissions]
  );

  return {
    ...adminQuery,
    permissions,
    hasPermission,
    isPermissionsLoading: Boolean(roleId) && roleQuery.isPending,
    isPermissionsError: roleQuery.isError,
    isLoading: adminQuery.isLoading || (Boolean(roleId) && roleQuery.isPending),
  };
}
