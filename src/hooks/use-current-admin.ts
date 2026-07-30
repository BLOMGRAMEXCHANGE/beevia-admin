import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CurrentAdmin } from "@/types/admin";

async function fetchCurrentAdmin(): Promise<CurrentAdmin> {
  const { data } = await apiClient.get<CurrentAdmin>("/me");
  return data;
}

export function useCurrentAdmin() {
  return useQuery({
    queryKey: ["current-admin"],
    queryFn: fetchCurrentAdmin,
    staleTime: 5 * 60 * 1000,
  });
}
