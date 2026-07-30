import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  AdminAccount,
  AdminAccountStatus,
  AdminRole,
} from "@/types/admin";

export function useAdminAccounts() {
  return useQuery({
    queryKey: ["admin-accounts"],
    queryFn: async () => {
      const { data } = await apiClient.get<AdminAccount[]>("/admin-accounts");
      return data;
    },
  });
}

export function useUpdateAdminRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: AdminRole }) => {
      const { data } = await apiClient.patch<AdminAccount>(
        `/admin-accounts/${id}`,
        { role }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
    },
  });
}

export function useUpdateAdminStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: AdminAccountStatus;
    }) => {
      const { data } = await apiClient.patch<AdminAccount>(
        `/admin-accounts/${id}`,
        { status }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
    },
  });
}

export function useInviteAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: AdminRole }) => {
      const { data } = await apiClient.post<AdminAccount>("/admin-accounts", {
        email,
        role,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
    },
  });
}
