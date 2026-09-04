import type { ComponentType } from "react";
import {
  Activity,
  KeyRound,
  ShieldAlert,
  UserCog,
  UserPlus,
} from "lucide-react";
import type { ActivityFeedItem } from "@/features/dashboard/api";

/**
 * Icon per known `action` value (mirrors the four event types the old mock
 * model rendered). `Activity` is the fallback for anything else the live feed
 * returns — the row still renders, just with a generic icon.
 */
const ACTION_ICON: Record<string, ComponentType<{ className?: string }>> = {
  admin_invited: UserPlus,
  admin_role_changed: UserCog,
  admin_account_status_changed: KeyRound,
  user_status_changed: ShieldAlert,
};

export interface PresentedActivity {
  /** Ready-to-display line — passed through from the backend's `summary`. */
  line: string;
  /** `null` when the target can't be resolved to a page — row renders unlinked. */
  href: string | null;
  icon: ComponentType<{ className?: string }>;
}

/**
 * Presents a live `/admin/activity` item for a feed row. Unlike the old mock
 * model's `presentActivity`, there's no line construction here — the backend
 * already sends a display-ready `summary`. This only derives the icon (by
 * `action`) and the click-through href (by `target.entity_type`).
 */
export function presentLiveActivity(item: ActivityFeedItem): PresentedActivity {
  const href =
    item.targetEntityType === "user" && item.targetEntityId
      ? `/users/${item.targetEntityId}`
      : item.targetEntityType === "admin"
        ? "/admin-accounts"
        : null;

  return {
    line: item.summary,
    href,
    icon: ACTION_ICON[item.action] ?? Activity,
  };
}
