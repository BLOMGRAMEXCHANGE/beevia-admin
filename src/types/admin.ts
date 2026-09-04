export type AdminRole = "support" | "compliance" | "super_admin";
export type AdminAccessLevel = "full" | "limited" | "read_only";
export type AdminAccountStatus = "active" | "invited" | "inactive";

export interface CurrentAdmin {
  id: string;
  name: string;
  email: string;
  role: AdminRole;

  roleId?: string;
  roleName?: string;
  accessLevel?: AdminAccessLevel;
}

export interface RoleSummary {
  id: string;
  name: string;
  description: string;
  type: "system" | "custom";
  status: "active" | "inactive";
  assignedAdminCount: number;
  accessLevel: AdminAccessLevel;
  updatedAt: string;
}

export interface AdminAccount {
  id: string;
  fullName: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  roleId: string;
  roleName: string;
  accessLevel: AdminAccessLevel;
  status: AdminAccountStatus;

  /** Null for an admin who hasn't accepted their invite yet (never logged in). */
  lastActiveAt: string | null;
}
