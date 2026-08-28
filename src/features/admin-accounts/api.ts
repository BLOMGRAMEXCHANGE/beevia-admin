import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { liveClient } from "@/lib/api-client";
import type {
  AdminAccessLevel,
  AdminAccount,
  AdminAccountStatus,
} from "@/types/admin";

export class AdminAccountApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

function toAdminAccountApiError(error: unknown): AdminAccountApiError {
  if (isAxiosError<{ message?: string }>(error)) {
    return new AdminAccountApiError(
      error.response?.data?.message ?? "Something went wrong.",
      error.response?.status
    );
  }
  return new AdminAccountApiError("Something went wrong.");
}

interface AdminAccountData {
  id: string;
  full_name: string;
  username: string;
  email: string;
  avatar_url: string | null;
  role: {
    id: string;
    name: string;
  };
  access_level: AdminAccessLevel;
  status: AdminAccountStatus;
  last_active_at: string;
}

function toAdminAccount(data: AdminAccountData): AdminAccount {
  return {
    id: data.id,
    fullName: data.full_name,
    username: data.username,
    email: data.email,
    avatarUrl: data.avatar_url,
    roleId: data.role.id,
    roleName: data.role.name,
    accessLevel: data.access_level,
    status: data.status,
    lastActiveAt: data.last_active_at,
  };
}

export interface AdminAccountsPageMeta {
  total: number;
  currentPage: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface AdminAccountsListResponseData {
  data: AdminAccountData[];
  meta: {
    total: number;
    current_page: number;
    limit: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
}

export function useAdminAccounts(page: number, limit: number) {
  return useQuery({
    queryKey: ["admin-accounts", page, limit],
    queryFn: async () => {
      try {
        const { data } = await liveClient.get<AdminAccountsListResponseData>(
          "/admin/accounts",
          { params: { page, limit } }
        );
        const meta: AdminAccountsPageMeta = {
          total: data.meta.total,
          currentPage: data.meta.current_page,
          limit: data.meta.limit,
          totalPages: data.meta.total_pages,
          hasNextPage: data.meta.has_next_page,
          hasPrevPage: data.meta.has_prev_page,
        };
        return { accounts: data.data.map(toAdminAccount), meta };
      } catch (error) {
        throw toAdminAccountApiError(error);
      }
    },
  });
}

export interface InviteAdminPayload {
  fullName: string;
  email: string;
  roleId: string;
}

interface InviteAdminResponseData {
  id: string;
  full_name: string;
  email: string;
  role_id: string;
  role_name: string;
  status: AdminAccountStatus;
  /** Last login time — distinct from `last_active_at` on the accounts list. */
  last_login_at: string | null;
}

export interface InviteAdminResult {
  id: string;
  fullName: string;
  email: string;
  roleId: string;
  roleName: string;
  status: AdminAccountStatus;
  /** Distinct from `lastActiveAt` on the accounts list — this is last-login, not last-active. */
  lastLoginAt: string | null;
}

function toInviteAdminResult(data: InviteAdminResponseData): InviteAdminResult {
  return {
    id: data.id,
    fullName: data.full_name,
    email: data.email,
    roleId: data.role_id,
    roleName: data.role_name,
    status: data.status,
    lastLoginAt: data.last_login_at,
  };
}

export function useInviteAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: InviteAdminPayload) => {
      try {
        const { data } = await liveClient.post<{
          data: InviteAdminResponseData;
        }>("/admin/accounts/invite", payload);
        return toInviteAdminResult(data.data);
      } catch (error) {
        throw toAdminAccountApiError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
    },
  });
}

export interface UpdateAdminAccountStatusPayload {
  adminId: string;
  status: Extract<AdminAccountStatus, "active" | "inactive">;
}

interface UpdateAdminAccountStatusResponseData {
  id: string;
  full_name: string;
  email: string;
  status: AdminAccountStatus;
  role: {
    id: string;
    name: string;
    access_level: AdminAccessLevel;
  };
  last_login_at: string | null;
  created_at: string;
}

export interface UpdateAdminAccountStatusResult {
  id: string;
  fullName: string;
  email: string;
  status: AdminAccountStatus;
  roleId: string;
  roleName: string;
  accessLevel: AdminAccessLevel;
}

function toUpdateAdminAccountStatusResult(
  data: UpdateAdminAccountStatusResponseData
): UpdateAdminAccountStatusResult {
  return {
    id: data.id,
    fullName: data.full_name,
    email: data.email,
    status: data.status,
    roleId: data.role.id,
    roleName: data.role.name,
    accessLevel: data.role.access_level,
  };
}

export function useUpdateAdminAccountStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      adminId,
      status,
    }: UpdateAdminAccountStatusPayload) => {
      try {
        const { data } = await liveClient.patch<{
          data: UpdateAdminAccountStatusResponseData;
        }>(`/admin/accounts/${adminId}`, { status });
        return toUpdateAdminAccountStatusResult(data.data);
      } catch (error) {
        throw toAdminAccountApiError(error);
      }
    },
    onSuccess: () => {
      // Refetch from the server rather than patching local state, so the
      // row reflects real data (status, and anything else that changed).
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
    },
  });
}

// There's no dedicated "how many active Super Admins" endpoint, so this is
// computed client-side from a single high-limit fetch of the full accounts
// list (the admin team is small — a one-time full fetch is reasonable).
// This is a CLIENT-SIDE SAFEGUARD ONLY: it disables the deactivate action in
// the UI, but nothing stops a direct API call from deactivating the last
// active Super Admin unless the backend also enforces this rule.
const ACTIVE_SUPER_ADMIN_COUNT_LIMIT = 200;

export function useActiveSuperAdminCount() {
  return useQuery({
    queryKey: ["admin-accounts", "active-super-admin-count"],
    queryFn: async () => {
      try {
        const { data } = await liveClient.get<AdminAccountsListResponseData>(
          "/admin/accounts",
          { params: { page: 1, limit: ACTIVE_SUPER_ADMIN_COUNT_LIMIT } }
        );
        return data.data.filter(
          (account) =>
            account.access_level === "full" && account.status === "active"
        ).length;
      } catch (error) {
        throw toAdminAccountApiError(error);
      }
    },
  });
}
