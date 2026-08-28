export const PERMISSION_MODULES = [
  "dashboard",
  "users",
  "chats",
  "wallets",
  "transactions",
  "kyc",
  "reports",
  "analytics",
  "roles_permissions",
  "admin_accounts",
  "system_settings",
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

export const PERMISSION_ACTIONS = [
  "canView",
  "canCreate",
  "canEdit",
  "canDelete",
  "canApprove",
  "canExport",
  "canManage",
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export const MODULE_LABEL: Record<PermissionModule, string> = {
  dashboard: "Dashboard",
  users: "Users",
  chats: "Chats",
  wallets: "Wallets",
  transactions: "Transactions",
  kyc: "KYC",
  reports: "Reports",
  analytics: "Analytics",
  roles_permissions: "Roles & Permissions",
  admin_accounts: "Admin Accounts",
  system_settings: "System Settings",
};

export const ACTION_LABEL: Record<PermissionAction, string> = {
  canView: "View",
  canCreate: "Create",
  canEdit: "Edit",
  canDelete: "Delete",
  canApprove: "Approve",
  canExport: "Export",
  canManage: "Manage",
};
