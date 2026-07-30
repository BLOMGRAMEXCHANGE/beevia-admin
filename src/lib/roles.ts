import type { AdminRole } from "@/types/admin";

export const ALL_ROLES: AdminRole[] = ["support", "compliance", "super_admin"];

export const ROLE_ROUTE_MAP: Record<string, AdminRole[]> = {
  "/admin-accounts": ["super_admin"],
  "/roles-permissions": ["super_admin"],
  "/users": ALL_ROLES,
  "/settings": ALL_ROLES,
};

export function getAllowedRolesForPath(pathname: string): AdminRole[] | null {
  const match = Object.keys(ROLE_ROUTE_MAP).find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  return match ? ROLE_ROUTE_MAP[match] : null;
}

export const ROLE_LABEL: Record<AdminRole, string> = {
  support: "Support",
  compliance: "Compliance",
  super_admin: "Super Admin",
};
