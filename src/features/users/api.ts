import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  AppUser,
  AuditEntry,
  CaseNote,
  SuspensionReason,
  UserAccountStatus,
} from "@/types/user";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await apiClient.get<AppUser[]>("/users");
      return data;
    },
  });
}

export function useUserDetail(userId: string) {
  return useQuery({
    queryKey: ["users", userId],
    queryFn: async () => {
      const { data } = await apiClient.get<AppUser>(`/users/${userId}`);
      return data;
    },
    enabled: Boolean(userId),
  });
}

export function useUserCaseNotes(userId: string) {
  return useQuery({
    queryKey: ["users", userId, "case-notes"],
    queryFn: async () => {
      const { data } = await apiClient.get<CaseNote[]>(
        `/users/${userId}/case-notes`
      );
      return data;
    },
    enabled: Boolean(userId),
  });
}

interface UpdateUserStatusInput {
  status: UserAccountStatus;
  reason?: SuspensionReason;
  note?: string;
}

export function useUpdateUserStatus(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ status, reason, note }: UpdateUserStatusInput) => {
      const { data } = await apiClient.patch<AppUser>(`/users/${userId}`, {
        status,
        reason,
        note,
      });
      return data;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["users", userId], updatedUser);
      queryClient.invalidateQueries({
        queryKey: ["users", userId, "audit-trail"],
      });
    },
  });
}

export function useUserAuditTrail(userId: string) {
  return useQuery({
    queryKey: ["users", userId, "audit-trail"],
    queryFn: async () => {
      const { data } = await apiClient.get<AuditEntry[]>(
        `/users/${userId}/audit-trail`
      );
      return data;
    },
    enabled: Boolean(userId),
  });
}

export function useAddCaseNote(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const { data } = await apiClient.post<CaseNote>(
        `/users/${userId}/case-notes`,
        { body }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users", userId, "case-notes"],
      });
    },
  });
}
