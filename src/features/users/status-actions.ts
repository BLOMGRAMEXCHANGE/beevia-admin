import type {
  PermissionAction,
  PermissionModule,
} from "@/features/roles/constants";
import type { UserAccountStatus } from "@/types/user";

export type StatusChangeActionName =
  "suspend" | "restrict" | "activate" | "deactivate";

export interface StatusActionConfig {
  action: StatusChangeActionName;
  label: string;
  loadingLabel: string;
  resultingStatus: UserAccountStatus;
  availableFrom: UserAccountStatus[];
  permission: { module: PermissionModule; action: PermissionAction };
  severity: "standard" | "severe";
}

export const STATUS_ACTIONS: StatusActionConfig[] = [
  {
    action: "suspend",
    label: "Suspend",
    loadingLabel: "Suspending…",
    resultingStatus: "suspended",
    availableFrom: ["active"],
    permission: { module: "users", action: "canEdit" },
    severity: "standard",
  },
  {
    action: "restrict",
    label: "Restrict",
    loadingLabel: "Restricting…",
    resultingStatus: "restricted",
    availableFrom: ["active"],
    permission: { module: "users", action: "canEdit" },
    severity: "standard",
  },
  {
    action: "activate",
    label: "Activate",
    loadingLabel: "Activating…",
    resultingStatus: "active",
    availableFrom: ["restricted", "suspended", "deactivated"],
    permission: { module: "users", action: "canEdit" },
    severity: "standard",
  },
  {
    action: "deactivate",
    label: "Deactivate",
    loadingLabel: "Deactivating…",
    resultingStatus: "deactivated",
    availableFrom: ["active", "restricted", "suspended"],
    permission: { module: "users", action: "canDelete" },
    severity: "severe",
  },
];
