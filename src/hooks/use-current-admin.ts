import { useQuery } from "@tanstack/react-query";
import { getStoredAdmin } from "@/lib/token-store";
import type { CurrentAdmin } from "@/types/admin";

async function fetchCurrentAdmin(): Promise<CurrentAdmin> {
  const admin = getStoredAdmin();
  if (!admin) throw new Error("Not signed in");
  return admin;
}

export function useCurrentAdmin() {
  return useQuery({
    queryKey: ["current-admin"],
    queryFn: fetchCurrentAdmin,
    staleTime: Infinity,
    retry: false,
  });
}
