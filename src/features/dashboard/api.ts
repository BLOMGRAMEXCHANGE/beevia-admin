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

/* -------------------------------------------------------------------------- */
/*  GET /admin/dashboard — overview metrics                                    */
/* -------------------------------------------------------------------------- */

/**
 * Raw shape of `GET /admin/dashboard`'s `data` block. Monetary fields arrive
 * as decimal strings in naira (e.g. `"81526.00"`); `toDashboardOverview`
 * parses them to numbers so the UI never does `parseFloat` inline.
 */
interface DashboardOverviewData {
  generated_at: string;
  users: {
    total: number;
    active: number;
    new_today: number;
    new_this_week: number;
    new_this_month: number;
    by_path: Record<string, number>;
    by_status: Record<string, number>;
  };
  kyc: {
    users_pending_review: number;
    users_with_failed_check: number;
  };
  transactions: {
    today: { count: number; volume_ngn: string };
    this_week: { count: number; volume_ngn: string };
    by_type_this_month: Record<string, string>;
  };
  payouts: {
    pending: number;
    pending_amount_ngn: string;
  };
  treasury: {
    ledger_liability_ngn: string;
    pool_balance_ngn: string;
    solvent: boolean;
    configured: boolean;
  };
  admins: {
    total: number;
    pending_invites: number;
  };
}

export interface DashboardTxnBucket {
  count: number;
  volumeNgn: number;
}

export interface DashboardOverview {
  generatedAt: string;
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    /** Open-keyed — backend may add paths; render whatever comes back. */
    byPath: Array<{ key: string; count: number }>;
    byStatus: Array<{ key: string; count: number }>;
  };
  kyc: {
    usersPendingReview: number;
    usersWithFailedCheck: number;
  };
  transactions: {
    today: DashboardTxnBucket;
    thisWeek: DashboardTxnBucket;
    byTypeThisMonth: Array<{ key: string; volumeNgn: number }>;
  };
  payouts: {
    pending: number;
    pendingAmountNgn: number;
  };
  treasury: {
    ledgerLiabilityNgn: number;
    poolBalanceNgn: number;
    solvent: boolean;
    configured: boolean;
  };
  admins: {
    total: number;
    pendingInvites: number;
  };
}

function toAmount(value: string | undefined): number {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function toRecordEntries(
  record: Record<string, number> | undefined
): Array<{ key: string; count: number }> {
  return Object.entries(record ?? {}).map(([key, count]) => ({ key, count }));
}

function toDashboardOverview(data: DashboardOverviewData): DashboardOverview {
  return {
    generatedAt: data.generated_at,
    users: {
      total: data.users.total,
      active: data.users.active,
      newToday: data.users.new_today,
      newThisWeek: data.users.new_this_week,
      newThisMonth: data.users.new_this_month,
      byPath: toRecordEntries(data.users.by_path),
      byStatus: toRecordEntries(data.users.by_status),
    },
    kyc: {
      usersPendingReview: data.kyc.users_pending_review,
      usersWithFailedCheck: data.kyc.users_with_failed_check,
    },
    transactions: {
      today: {
        count: data.transactions.today.count,
        volumeNgn: toAmount(data.transactions.today.volume_ngn),
      },
      thisWeek: {
        count: data.transactions.this_week.count,
        volumeNgn: toAmount(data.transactions.this_week.volume_ngn),
      },
      byTypeThisMonth: Object.entries(
        data.transactions.by_type_this_month ?? {}
      ).map(([key, volume]) => ({ key, volumeNgn: toAmount(volume) })),
    },
    payouts: {
      pending: data.payouts.pending,
      pendingAmountNgn: toAmount(data.payouts.pending_amount_ngn),
    },
    treasury: {
      ledgerLiabilityNgn: toAmount(data.treasury.ledger_liability_ngn),
      poolBalanceNgn: toAmount(data.treasury.pool_balance_ngn),
      solvent: data.treasury.solvent,
      configured: data.treasury.configured,
    },
    admins: {
      total: data.admins.total,
      pendingInvites: data.admins.pending_invites,
    },
  };
}

/** `GET /admin/dashboard` — confirmed live. Powers the overview page. */
export function useDashboardOverview() {
  return useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: async () => {
      try {
        const { data } = await liveClient.get<{ data: DashboardOverviewData }>(
          "/admin/dashboard"
        );
        return toDashboardOverview(data.data);
      } catch (error) {
        throw toActivityApiError(error);
      }
    },
  });
}
