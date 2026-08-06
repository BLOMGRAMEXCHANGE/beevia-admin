export type AdminRole = "support" | "compliance" | "super_admin";
export type AdminAccessLevel = "full" | "limited" | "read_only";
export type AdminAccountStatus = "active" | "inactive";

export interface CurrentAdmin {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  /** Real role id/name/access level from `/admin/roles/{id}`, once more than one role exists. */
  roleId?: string;
  roleName?: string;
  accessLevel?: AdminAccessLevel;
}

/** Shape of an item from `GET /admin/roles` (and `/admin/roles/{id}` without `permissions`). */
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

export interface AdminAccount extends CurrentAdmin {
  username: string;
  avatarColor: string;
  accessLevel: AdminAccessLevel;
  status: AdminAccountStatus;
  createdAt: string;
  lastActiveAt: string;
}
