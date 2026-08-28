"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { useCurrentAdmin } from "@/hooks/use-current-admin";
import type {
  PermissionAction,
  PermissionModule,
} from "@/features/roles/constants";
import {
  DASHBOARD_SCENARIOS,
  SCENARIO_MATRICES,
  type DashboardScenario,
} from "@/features/dashboard/mock/scenarios";

const STORAGE_KEY = "beevia:dashboard-scenario";
const DEFAULT_SCENARIO: DashboardScenario = "full";

function isScenario(value: string | null): value is DashboardScenario {
  return DASHBOARD_SCENARIOS.some((s) => s.id === value);
}

/**
 * Tiny external store for the active mock scenario, persisted to localStorage.
 * Using useSyncExternalStore keeps the read out of an effect (and gives a
 * stable SSR snapshot).
 */
const scenarioStore = (() => {
  const listeners = new Set<() => void>();
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    get(): DashboardScenario {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (isScenario(stored)) return stored;
      } catch {
        // ignore unavailable storage
      }
      return DEFAULT_SCENARIO;
    },
    set(next: DashboardScenario) {
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore unavailable storage
      }
      listeners.forEach((listener) => listener());
    },
  };
})();

interface ScenarioContextValue {
  scenario: DashboardScenario;
  setScenario: (scenario: DashboardScenario) => void;
}

const ScenarioContext = createContext<ScenarioContextValue | null>(null);

export function DashboardScenarioProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const scenario = useSyncExternalStore(
    scenarioStore.subscribe,
    scenarioStore.get,
    () => DEFAULT_SCENARIO
  );

  const value = useMemo<ScenarioContextValue>(
    () => ({ scenario, setScenario: scenarioStore.set }),
    [scenario]
  );

  return (
    <ScenarioContext.Provider value={value}>
      {children}
    </ScenarioContext.Provider>
  );
}

export function useDashboardScenario(): ScenarioContextValue {
  const context = useContext(ScenarioContext);
  if (!context) {
    throw new Error(
      "useDashboardScenario must be used within a DashboardScenarioProvider"
    );
  }
  return context;
}

export type HasPermission = (
  module: PermissionModule,
  action: PermissionAction
) => boolean;

/**
 * Same signature as useCurrentAdmin().hasPermission. When the active scenario
 * is `real` it forwards to the signed-in admin's permissions; otherwise it
 * resolves against a hardcoded mock matrix so gating stays visually testable.
 *
 * Swapping to real permission data later means deleting the scenario branch —
 * every consumer already calls hasPermission(module, action).
 */
/**
 * Whether the (mock) admin is a Super Admin. Card 1 of the financial section
 * uses this stricter gate. In scenario mode only "full" grants it; "real"
 * checks the signed-in admin's actual role.
 */
export function useDashboardRole(): { isSuperAdmin: boolean } {
  const { scenario } = useDashboardScenario();
  const { data: admin } = useCurrentAdmin();

  if (scenario === "real") {
    return { isSuperAdmin: admin?.role === "super_admin" };
  }
  return { isSuperAdmin: scenario === "full" };
}

export function useDashboardCapability(): { hasPermission: HasPermission } {
  const { scenario } = useDashboardScenario();
  const { hasPermission: realHasPermission } = useCurrentAdmin();

  const hasPermission = useCallback<HasPermission>(
    (module, action) => {
      if (scenario === "real") return realHasPermission(module, action);
      return SCENARIO_MATRICES[scenario][module]?.[action] ?? false;
    },
    [scenario, realHasPermission]
  );

  return { hasPermission };
}
