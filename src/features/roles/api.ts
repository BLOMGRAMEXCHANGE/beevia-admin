import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { liveClient } from "@/lib/api-client";
import type { AdminAccessLevel, RoleSummary } from "@/types/admin";
import type {
  AssignedAdminSummary,
  RolePermissionRequest,
  RolePermissionResponse,
} from "@/features/roles/types";

export class RoleApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

function toRoleApiError(error: unknown): RoleApiError {
  if (isAxiosError<{ message?: string }>(error)) {
    return new RoleApiError(
      error.response?.data?.message ?? "Something went wrong.",
      error.response?.status
    );
  }
  return new RoleApiError("Something went wrong.");
}

interface RoleSummaryData {
  id: string;
  name: string;
  description: string;
  type: "system" | "custom";
  status: "active" | "inactive";
  assigned_admin_count: number;
  access_level: AdminAccessLevel;
  updated_at: string;
}

function toRoleSummary(data: RoleSummaryData): RoleSummary {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    type: data.type,
    status: data.status,
    assignedAdminCount: data.assigned_admin_count,
    accessLevel: data.access_level,
    updatedAt: data.updated_at,
  };
}

export interface RolesPageMeta {
  total: number;
  currentPage: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface RolesListResponseData {
  data: RoleSummaryData[];
  meta: {
    total: number;
    current_page: number;
    limit: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
}

export function useRoles(page: number, limit: number) {
  return useQuery({
    queryKey: ["roles", page, limit],
    queryFn: async () => {
      try {
        const { data } = await liveClient.get<RolesListResponseData>(
          "/admin/roles",
          { params: { page, limit } }
        );
        const meta: RolesPageMeta = {
          total: data.meta.total,
          currentPage: data.meta.current_page,
          limit: data.meta.limit,
          totalPages: data.meta.total_pages,
          hasNextPage: data.meta.has_next_page,
          hasPrevPage: data.meta.has_prev_page,
        };
        return { roles: data.data.map(toRoleSummary), meta };
      } catch (error) {
        throw toRoleApiError(error);
      }
    },
  });
}

interface RoleDetailData extends RoleSummaryData {
  permissions: RolePermissionResponse[];
  assigned_admin_ids: string[];
}

export interface RoleDetail extends RoleSummary {
  permissions: RolePermissionResponse[];
  assignedAdminIds: string[];
}

function toRoleDetail(data: RoleDetailData): RoleDetail {
  return {
    ...toRoleSummary(data),
    permissions: data.permissions ?? [],
    assignedAdminIds: data.assigned_admin_ids ?? [],
  };
}

export function useRole(roleId: string) {
  return useQuery({
    queryKey: ["roles", roleId],
    queryFn: async () => {
      try {
        const { data } = await liveClient.get<{ data: RoleDetailData }>(
          `/admin/roles/${roleId}`
        );
        return toRoleDetail(data.data);
      } catch (error) {
        throw toRoleApiError(error);
      }
    },
    enabled: Boolean(roleId),
    retry: false,
  });
}

export interface RoleFormPayload {
  name: string;
  description: string;
  permissions: RolePermissionRequest[];
  adminIds: string[];
}

interface RoleMutationResponseData extends RoleDetailData {
  assigned_admins: { id: string; full_name: string; email: string }[];
}

export interface RoleMutationResult extends RoleDetail {
  assignedAdmins: AssignedAdminSummary[];
}

function toRoleMutationResult(
  data: RoleMutationResponseData
): RoleMutationResult {
  return {
    ...toRoleDetail(data),
    assignedAdmins: (data.assigned_admins ?? []).map((admin) => ({
      id: admin.id,
      fullName: admin.full_name,
      email: admin.email,
    })),
  };
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RoleFormPayload) => {
      try {
        const { data } = await liveClient.post<{
          data: RoleMutationResponseData;
        }>("/admin/roles", payload);
        return toRoleMutationResult(data.data);
      } catch (error) {
        throw toRoleApiError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export interface AssignAdminsToRolePayload {
  roleId: string;
  adminIds: string[];
}

export function useAssignAdminsToRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ roleId, adminIds }: AssignAdminsToRolePayload) => {
      try {
        await liveClient.post(`/admin/roles/${roleId}/assign-admins`, {
          adminIds,
        });
      } catch (error) {
        throw toRoleApiError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useUpdateRole(roleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RoleFormPayload) => {
      try {
        const { data } = await liveClient.patch<{
          data: RoleMutationResponseData;
        }>(`/admin/roles/${roleId}`, payload);
        return toRoleMutationResult(data.data);
      } catch (error) {
        throw toRoleApiError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["roles", roleId] });
    },
  });
}
