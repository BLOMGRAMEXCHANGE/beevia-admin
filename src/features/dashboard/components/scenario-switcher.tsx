"use client";

import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardScenario } from "@/features/dashboard/capability";
import { DASHBOARD_SCENARIOS } from "@/features/dashboard/mock/scenarios";

export function ScenarioSwitcher() {
  const { scenario, setScenario } = useDashboardScenario();
  const active = DASHBOARD_SCENARIOS.find((s) => s.id === scenario);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-amber-400/60 bg-amber-50/60 px-3 py-2 text-xs dark:bg-amber-950/20">
      <span className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
        <FlaskConical className="size-3.5" />
        Mock permissions
      </span>
      <div className="flex flex-wrap gap-1">
        {DASHBOARD_SCENARIOS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setScenario(option.id)}
            title={option.hint}
            className={cn(
              "rounded-md px-2 py-1 font-medium transition-colors",
              option.id === scenario
                ? "bg-amber-600 text-white"
                : "text-amber-800 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {active && (
        <span className="text-amber-700/80 dark:text-amber-400/70">
          {active.hint}
        </span>
      )}
    </div>
  );
}
