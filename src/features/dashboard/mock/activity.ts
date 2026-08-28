import type { ComponentType } from "react";
import { KeyRound, ShieldAlert, UserCog, UserPlus } from "lucide-react";
import type { PermissionModule } from "@/features/roles/constants";

/**
 * Mock activity + notification event model. Mirrors what a real
 * `GET /activity` feed (and the Socket.IO `notification` payload) is expected
 * to return. The four variants below are the only event types the feed and the
 * notification bell render today.
 */
export type ActivityEvent =
  | {
      id: string;
      type: "admin_invited";
      createdAt: string;
      actor: string;
      email: string;
      role: string;
    }
  | {
      id: string;
      type: "admin_role_changed";
      createdAt: string;
      actor: string;
      target: string;
      role: string;
    }
  | {
      id: string;
      type: "admin_account_status_changed";
      createdAt: string;
      actor: string;
      target: string;
      action: "deactivated" | "reactivated";
    }
  | {
      id: string;
      type: "user_status_changed";
      createdAt: string;
      actor: string;
      user: string;
      userId: string;
      action: "suspended" | "restricted" | "activated" | "deactivated";
    };

export type ActivityEventType = ActivityEvent["type"];

interface ActivityPresentation {
  line: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  /** Module a viewer must be able to `canView` to see this event. */
  module: PermissionModule;
}

export function presentActivity(event: ActivityEvent): ActivityPresentation {
  switch (event.type) {
    case "admin_invited":
      return {
        line: `${event.actor} invited ${event.email} as ${event.role}`,
        href: "/admin-accounts",
        icon: UserPlus,
        module: "admin_accounts",
      };
    case "admin_role_changed":
      return {
        line: `${event.actor} changed ${event.target}'s role to ${event.role}`,
        href: "/admin-accounts",
        icon: UserCog,
        module: "admin_accounts",
      };
    case "admin_account_status_changed":
      return {
        line: `${event.actor} ${event.action} ${event.target}'s account`,
        href: "/admin-accounts",
        icon: KeyRound,
        module: "admin_accounts",
      };
    case "user_status_changed":
      return {
        line: `${event.actor} ${event.action} ${event.user}`,
        href: `/users/${event.userId}`,
        icon: ShieldAlert,
        module: "users",
      };
  }
}

const MINUTE = 60_000;
function ago(minutes: number): string {
  return new Date(Date.now() - minutes * MINUTE).toISOString();
}

const ADMINS = [
  "Ada Admin",
  "Cam Compliance",
  "Sam Support",
  "Rita Reviewer",
  "Owen Ops",
];
const ROLES = ["Support", "Compliance", "Finance", "Read Only", "Super Admin"];

/**
 * ~30 mock events spanning the last several days, ordered newest-first.
 * `ActivityFeed` pages through this list; the notification bell shows the head.
 */
export const MOCK_ACTIVITY: ActivityEvent[] = [
  {
    id: "act-1",
    type: "admin_invited",
    createdAt: ago(8),
    actor: "Ada Admin",
    email: "jordan.blake@beevia.dev",
    role: "Compliance",
  },
  {
    id: "act-2",
    type: "user_status_changed",
    createdAt: ago(24),
    actor: "Cam Compliance",
    user: "Marcus Bello",
    userId: "user-2",
    action: "suspended",
  },
  {
    id: "act-3",
    type: "admin_role_changed",
    createdAt: ago(52),
    actor: "Ada Admin",
    target: "Sam Support",
    role: "Finance",
  },
  {
    id: "act-4",
    type: "user_status_changed",
    createdAt: ago(95),
    actor: "Rita Reviewer",
    user: "Amara Okoye",
    userId: "user-5",
    action: "restricted",
  },
  {
    id: "act-5",
    type: "admin_account_status_changed",
    createdAt: ago(140),
    actor: "Ada Admin",
    target: "Owen Ops",
    action: "deactivated",
  },
  {
    id: "act-6",
    type: "user_status_changed",
    createdAt: ago(190),
    actor: "Sam Support",
    user: "Tunde Ade",
    userId: "user-7",
    action: "activated",
  },
  {
    id: "act-7",
    type: "admin_invited",
    createdAt: ago(260),
    actor: "Cam Compliance",
    email: "nadia.hart@beevia.dev",
    role: "Support",
  },
  {
    id: "act-8",
    type: "user_status_changed",
    createdAt: ago(330),
    actor: "Cam Compliance",
    user: "Grace Umeh",
    userId: "user-9",
    action: "deactivated",
  },
  {
    id: "act-9",
    type: "admin_role_changed",
    createdAt: ago(410),
    actor: "Ada Admin",
    target: "Rita Reviewer",
    role: "Compliance",
  },
  {
    id: "act-10",
    type: "admin_account_status_changed",
    createdAt: ago(500),
    actor: "Ada Admin",
    target: "Owen Ops",
    action: "reactivated",
  },
  {
    id: "act-11",
    type: "user_status_changed",
    createdAt: ago(620),
    actor: "Rita Reviewer",
    user: "Kelechi Nwosu",
    userId: "user-11",
    action: "restricted",
  },
  {
    id: "act-12",
    type: "admin_invited",
    createdAt: ago(755),
    actor: "Ada Admin",
    email: "victor.paul@beevia.dev",
    role: "Read Only",
  },
  {
    id: "act-13",
    type: "user_status_changed",
    createdAt: ago(900),
    actor: "Sam Support",
    user: "Zainab Musa",
    userId: "user-13",
    action: "activated",
  },
  {
    id: "act-14",
    type: "admin_role_changed",
    createdAt: ago(1100),
    actor: "Cam Compliance",
    target: "Owen Ops",
    role: "Support",
  },
  {
    id: "act-15",
    type: "user_status_changed",
    createdAt: ago(1300),
    actor: "Cam Compliance",
    user: "David Eze",
    userId: "user-15",
    action: "suspended",
  },
  {
    id: "act-16",
    type: "admin_account_status_changed",
    createdAt: ago(1500),
    actor: "Ada Admin",
    target: "Sam Support",
    action: "deactivated",
  },
  {
    id: "act-17",
    type: "user_status_changed",
    createdAt: ago(1700),
    actor: "Rita Reviewer",
    user: "Ngozi Ibe",
    userId: "user-17",
    action: "restricted",
  },
  {
    id: "act-18",
    type: "admin_invited",
    createdAt: ago(1950),
    actor: "Cam Compliance",
    email: "leah.stone@beevia.dev",
    role: "Compliance",
  },
  {
    id: "act-19",
    type: "user_status_changed",
    createdAt: ago(2200),
    actor: "Sam Support",
    user: "Femi Balogun",
    userId: "user-19",
    action: "activated",
  },
  {
    id: "act-20",
    type: "admin_role_changed",
    createdAt: ago(2500),
    actor: "Ada Admin",
    target: "Sam Support",
    role: "Support",
  },
  {
    id: "act-21",
    type: "admin_account_status_changed",
    createdAt: ago(2800),
    actor: "Ada Admin",
    target: "Sam Support",
    action: "reactivated",
  },
  {
    id: "act-22",
    type: "user_status_changed",
    createdAt: ago(3100),
    actor: "Cam Compliance",
    user: "Bisi Adeyemi",
    userId: "user-22",
    action: "deactivated",
  },
  {
    id: "act-23",
    type: "admin_invited",
    createdAt: ago(3500),
    actor: "Ada Admin",
    email: "chris.dunn@beevia.dev",
    role: "Finance",
  },
  {
    id: "act-24",
    type: "user_status_changed",
    createdAt: ago(3900),
    actor: "Rita Reviewer",
    user: "Ada Nnaji",
    userId: "user-24",
    action: "restricted",
  },
  {
    id: "act-25",
    type: "admin_role_changed",
    createdAt: ago(4300),
    actor: "Cam Compliance",
    target: "Rita Reviewer",
    role: "Read Only",
  },
  {
    id: "act-26",
    type: "user_status_changed",
    createdAt: ago(4700),
    actor: "Sam Support",
    user: "Ini Etim",
    userId: "user-26",
    action: "activated",
  },
  {
    id: "act-27",
    type: "admin_account_status_changed",
    createdAt: ago(5200),
    actor: "Ada Admin",
    target: "Owen Ops",
    action: "deactivated",
  },
  {
    id: "act-28",
    type: "user_status_changed",
    createdAt: ago(5800),
    actor: "Cam Compliance",
    user: "Paul Okon",
    userId: "user-28",
    action: "suspended",
  },
  {
    id: "act-29",
    type: "admin_invited",
    createdAt: ago(6400),
    actor: "Ada Admin",
    email: "sara.lin@beevia.dev",
    role: "Support",
  },
  {
    id: "act-30",
    type: "user_status_changed",
    createdAt: ago(7000),
    actor: "Rita Reviewer",
    user: "Uche Obi",
    userId: "user-30",
    action: "restricted",
  },
];

/** Kept exported for tests / future generators. */
export const MOCK_ACTIVITY_HELPERS = { ADMINS, ROLES, ago };
