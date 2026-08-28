"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format";
import { useDashboardCapability } from "@/features/dashboard/capability";
import { useMockResource } from "@/features/dashboard/hooks/use-mock-resource";
import {
  MOCK_ACTIVITY,
  presentActivity,
  type ActivityEvent,
} from "@/features/dashboard/mock/activity";

const PAGE_SIZE = 6;
const FEED_DELAY = 900;

function FeedShell({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col">{children}</CardContent>
    </Card>
  );
}

function FeedLoading() {
  return (
    <div className="flex flex-col gap-4 py-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FeedEmpty() {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Inbox className="size-6 text-muted-foreground" />
      <p className="text-sm font-medium">No recent activity</p>
      <p className="text-xs text-muted-foreground">
        Admin and user changes will show up here as they happen.
      </p>
    </div>
  );
}

function FeedRow({ event }: { event: ActivityEvent }) {
  const presented = presentActivity(event);
  const Icon = presented.icon;
  return (
    <Link
      href={presented.href}
      className="-mx-2 flex items-start gap-3 rounded-md px-2 py-2.5 hover:bg-muted"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm">{presented.line}</span>
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(event.createdAt)}
        </span>
      </span>
    </Link>
  );
}

interface ActivityFeedProps {
  /** Render the empty state regardless of mock data (preview / QA). */
  previewEmpty?: boolean;
}

export function ActivityFeed({ previewEmpty = false }: ActivityFeedProps) {
  const { hasPermission } = useDashboardCapability();
  const { status, data, retry } = useMockResource<ActivityEvent[]>({
    data: MOCK_ACTIVITY,
    delayMs: FEED_DELAY,
  });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Per-item permission gating: an admin who can't view admin_accounts never
  // sees admin_* events, even mixed in with user events they can see.
  const permitted = useMemo(() => {
    if (!data) return [];
    return data.filter((event) =>
      hasPermission(presentActivity(event).module, "canView")
    );
  }, [data, hasPermission]);

  if (status === "loading") {
    return (
      <FeedShell>
        <FeedLoading />
      </FeedShell>
    );
  }

  if (status === "error") {
    return (
      <FeedShell>
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <AlertTriangle className="size-6 text-destructive" />
          <p className="text-sm">Couldn&apos;t load recent activity.</p>
          <Button variant="outline" size="sm" onClick={retry}>
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </div>
      </FeedShell>
    );
  }

  if (previewEmpty || permitted.length === 0) {
    return (
      <FeedShell>
        <FeedEmpty />
      </FeedShell>
    );
  }

  const visible = permitted.slice(0, visibleCount);
  const hasMore = visibleCount < permitted.length;

  return (
    <FeedShell>
      <div className="flex flex-col divide-y">
        {visible.map((event) => (
          <FeedRow key={event.id} event={event} />
        ))}
      </div>
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 self-center"
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
        >
          Load more
        </Button>
      )}
    </FeedShell>
  );
}

/** Storybook-style preview of the empty state. */
export function ActivityFeedEmptyPreview() {
  return <ActivityFeed previewEmpty />;
}
