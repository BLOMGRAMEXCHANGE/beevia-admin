"use client";

import { useCurrentAdmin } from "@/hooks/use-current-admin";
import type { AdminRole } from "@/types/admin";

interface RoleGateProps {
  allow: AdminRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGate({ allow, children, fallback = null }: RoleGateProps) {
  const { data: admin, isLoading } = useCurrentAdmin();

  if (isLoading || !admin || !allow.includes(admin.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
