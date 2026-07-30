import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { AppUser, CaseNote, UserAccountStatus } from "@/types/user";

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

export function useUpdateUserStatus(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (status: UserAccountStatus) => {
      const { data } = await apiClient.patch<AppUser>(`/users/${userId}`, {
        status,
      });
      return data;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["users", userId], updatedUser);
    },
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
