"use client";

import { useSyncExternalStore } from "react";
import { useCurrentAdmin } from "@/hooks/use-current-admin";
import type { AdminRole } from "@/types/admin";

interface RoleGateProps {
  allow: AdminRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const noop = () => () => {};

/** False during SSR and the first client render, true once mounted — without
 * calling setState in an effect (which the lint rules disallow). */
function useHasMounted(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false
  );
}

export function RoleGate({ allow, children, fallback = null }: RoleGateProps) {
  const { data: admin, isLoading } = useCurrentAdmin();
  const hasMounted = useHasMounted();

  if (!hasMounted || isLoading || !admin || !allow.includes(admin.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
