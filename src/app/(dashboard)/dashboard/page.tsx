"use client";

import { DashboardScenarioProvider } from "@/features/dashboard/capability";
import { DashboardOverviewSections } from "@/features/dashboard/components/overview";
import { QuickActions } from "@/features/dashboard/components/quick-actions";
import { ActivityFeed } from "@/features/dashboard/components/activity-feed";

export default function DashboardOverviewPage() {
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

        <DashboardOverviewSections />

        <QuickActions />

        <ActivityFeed />
      </div>
    </DashboardScenarioProvider>
  );
}
