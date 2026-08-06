import type { AdminAccessLevel, AdminRole } from "@/types/admin";

export const ALL_ROLES: AdminRole[] = ["support", "compliance", "super_admin"];

/**
 * The backend has one role model (`/admin/roles`) with a name and an
 * access_level, not the three fixed roles this app's nav/route gating was
 * built around. Until more roles exist, derive the closest legacy role from
 * access_level so the existing gating keeps working.
 */
export function mapAccessLevelToRole(accessLevel: AdminAccessLevel): AdminRole {
  if (accessLevel === "full") return "super_admin";
  if (accessLevel === "limited") return "compliance";
  return "support";
}

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
