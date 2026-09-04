import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { liveClient } from "@/lib/api-client";

export class ActivityApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

function toActivityApiError(error: unknown): ActivityApiError {
  if (isAxiosError<{ message?: string }>(error)) {
    return new ActivityApiError(
      error.response?.data?.message ?? "Something went wrong.",
      error.response?.status
    );
  }
  return new ActivityApiError("Something went wrong.");
}

/**
 * A single row from the live `/admin/activity` feed. `action`/`module` are
 * open strings rather than closed unions — the sample only confirms
 * `admin_invited` / `admin_accounts`, and the feed must keep rendering
 * (generic icon, no click-through) for action/module values it hasn't seen.
 */
export interface ActivityFeedItem {
  id: string;
  action: string;
  module: string;
  actorName: string;
  targetEntityType: string | null;
  targetEntityId: string | null;
  /** Ready-to-display line — the backend builds this, unlike the older mock
   *  model which assembled it client-side from raw event fields. */
  summary: string;
  /** ISO timestamp. */
  occurredAt: string;
}

interface ActivityItemData {
  id: string;
  action: string;
  module: string;
  actor: { admin_id: string; name: string };
  target: { entity_type: string; entity_id: string } | null;
  summary: string;
  occurred_at: string;
}

interface ActivityFeedResponseData {
  data: {
    items: ActivityItemData[];
    next_cursor: string | null;
  };
}

function toActivityFeedItem(data: ActivityItemData): ActivityFeedItem {
  return {
    id: data.id,
    action: data.action,
    module: data.module,
    actorName: data.actor?.name ?? "Unknown admin",
    targetEntityType: data.target?.entity_type ?? null,
    targetEntityId: data.target?.entity_id ?? null,
    summary: data.summary,
    occurredAt: data.occurred_at,
  };
}

const ACTIVITY_FEED_FETCH_LIMIT = 50;

/**
 * `GET /admin/activity?limit=` — confirmed live. Fetches one batch of the most
 * recent activity; `ActivityFeed` reveals it progressively via its own
 * client-side "Load more" (unlike a report, which needs the full result set,
 * this header widget only ever needs "enough recent items"). The response
 * also carries `next_cursor` for real cursor pagination — unused for now since
 * a single 50-item batch comfortably covers the feed's reveal pattern; wire it
 * up if a deeper history is ever needed.
 */
export function useActivityFeed(limit: number = ACTIVITY_FEED_FETCH_LIMIT) {
  return useQuery({
    queryKey: ["dashboard", "activity", limit],
    queryFn: async () => {
      try {
        const { data } = await liveClient.get<ActivityFeedResponseData>(
          "/admin/activity",
          { params: { limit } }
        );
        return data.data.items.map(toActivityFeedItem);
      } catch (error) {
        throw toActivityApiError(error);
      }
    },
  });
}
