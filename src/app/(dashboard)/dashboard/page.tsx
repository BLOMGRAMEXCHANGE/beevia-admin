"use client";

import { useState } from "react";
import { DashboardScenarioProvider } from "@/features/dashboard/capability";
import { ScenarioSwitcher } from "@/features/dashboard/components/scenario-switcher";
import { SummaryCards } from "@/features/dashboard/components/summary-cards";
import { FinancialSection } from "@/features/dashboard/components/financial-section";
import { QuickActions } from "@/features/dashboard/components/quick-actions";
import { ActivityFeed } from "@/features/dashboard/components/activity-feed";

export default function DashboardOverviewPage() {
  const [previewEmptyFeed, setPreviewEmptyFeed] = useState(false);

  return (
    <DashboardScenarioProvider>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            An overview of platform activity.
          </p>
        </div>

        {/* Dev-only controls — remove with the mock data pass. */}
        {/* <div className="flex flex-wrap items-center gap-3">
          <ScenarioSwitcher />
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={previewEmptyFeed}
              onChange={(event) => setPreviewEmptyFeed(event.target.checked)}
            />
            Preview empty activity feed
          </label>
        </div> */}

        {/* Section 1 — Summary cards */}
        <SummaryCards />

        {/* Section 2 — Reserved financial cards slot */}
        <FinancialSection />

        {/* Section 3 — Quick actions */}
        <QuickActions />

        {/* Section 4 — Recent activity feed */}
        <ActivityFeed previewEmpty={previewEmptyFeed} />
      </div>
    </DashboardScenarioProvider>
  );
}
