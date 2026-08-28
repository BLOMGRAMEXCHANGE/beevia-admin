import {
  PERMISSION_ACTIONS,
  type PermissionAction,
  type PermissionModule,
} from "@/features/roles/constants";
import {
  emptyPermissionMatrix,
  type PermissionMatrixState,
} from "@/features/roles/types";

/**
 * Mock permission scenarios for visually testing capability-gating on the
 * dashboard. Swap the active scenario with the on-page Scenario Switcher.
 *
 * `real` defers to the signed-in admin's actual permissions (via
 * useCurrentAdmin). Every other scenario is a hardcoded matrix so gating can
 * be exercised without touching auth state.
 */
export type DashboardScenario = "real" | "full" | "minimal" | "none";

export const DASHBOARD_SCENARIOS: {
  id: DashboardScenario;
  label: string;
  hint: string;
}[] = [
  {
    id: "real",
    label: "Real admin",
    hint: "Uses your actual role permissions",
  },
  { id: "full", label: "Full access", hint: "Every module + action granted" },
  {
    id: "minimal",
    label: "Minimal access",
    hint: "Only Users:View — most things hidden",
  },
  { id: "none", label: "No access", hint: "Nothing granted — empty states" },
];

function grantAll(): PermissionMatrixState {
  const matrix = emptyPermissionMatrix();
  for (const mod of Object.keys(matrix) as PermissionModule[]) {
    for (const action of PERMISSION_ACTIONS) {
      matrix[mod][action] = true;
    }
  }
  return matrix;
}

function grant(
  grants: Partial<Record<PermissionModule, PermissionAction[]>>
): PermissionMatrixState {
  const matrix = emptyPermissionMatrix();
  for (const [mod, actions] of Object.entries(grants)) {
    for (const action of actions ?? []) {
      matrix[mod as PermissionModule][action] = true;
    }
  }
  return matrix;
}

export const SCENARIO_MATRICES: Record<
  Exclude<DashboardScenario, "real">,
  PermissionMatrixState
> = {
  full: grantAll(),
  minimal: grant({ users: ["canView"] }),
  none: emptyPermissionMatrix(),
};
