import {
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  type PermissionAction,
  type PermissionModule,
} from "@/features/roles/constants";

export type RolePermissionRequest = { module: PermissionModule } & Record<
  PermissionAction,
  boolean
>;

export interface RolePermissionResponse {
  module: PermissionModule;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
  can_export: boolean;
  can_manage: boolean;
}

export type PermissionMatrixState = Record<
  PermissionModule,
  Record<PermissionAction, boolean>
>;

export function emptyPermissionMatrix(): PermissionMatrixState {
  return PERMISSION_MODULES.reduce((matrix, module) => {
    matrix[module] = PERMISSION_ACTIONS.reduce(
      (actions, action) => {
        actions[action] = false;
        return actions;
      },
      {} as Record<PermissionAction, boolean>
    );
    return matrix;
  }, {} as PermissionMatrixState);
}

export function permissionResponseToMatrix(
  permissions: RolePermissionResponse[]
): PermissionMatrixState {
  const matrix = emptyPermissionMatrix();
  for (const permission of permissions) {
    if (!matrix[permission.module]) continue;
    matrix[permission.module] = {
      canView: permission.can_view,
      canCreate: permission.can_create,
      canEdit: permission.can_edit,
      canDelete: permission.can_delete,
      canApprove: permission.can_approve,
      canExport: permission.can_export,
      canManage: permission.can_manage,
    };
  }
  return matrix;
}

export function matrixToPermissionRequest(
  matrix: PermissionMatrixState
): RolePermissionRequest[] {
  return PERMISSION_MODULES.map((module) => ({
    module,
    ...matrix[module],
  }));
}

export interface AssignedAdminSummary {
  id: string;
  fullName: string;
  email: string;
}
