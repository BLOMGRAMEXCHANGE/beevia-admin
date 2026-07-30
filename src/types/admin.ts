export type AdminRole = "support" | "compliance" | "super_admin";
export type AdminAccessLevel = "full" | "limited" | "read_only";
export type AdminAccountStatus = "active" | "inactive";

export interface CurrentAdmin {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}

export interface AdminAccount extends CurrentAdmin {
  username: string;
  avatarColor: string;
  accessLevel: AdminAccessLevel;
  status: AdminAccountStatus;
  createdAt: string;
  lastActiveAt: string;
}
