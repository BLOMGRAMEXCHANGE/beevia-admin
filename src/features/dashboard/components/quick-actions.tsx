"use client";

import Link from "next/link";
import { Plus, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardCapability } from "@/features/dashboard/capability";

/**
 * Each action shows only if the mock admin holds the matching permission.
 * "Invite Admin" deep-links to /admin-accounts?invite=1; InviteAdminDialog
 * opens itself when that param is present.
 */
export function QuickActions() {
  const { hasPermission } = useDashboardCapability();

  const actions = [
    {
      key: "search-users",
      label: "Search Users",
      href: "/users",
      icon: Search,
      visible: hasPermission("users", "canView"),
    },
    {
      key: "invite-admin",
      label: "Invite Admin",
      href: "/admin-accounts?invite=1",
      icon: UserPlus,
      visible: hasPermission("admin_accounts", "canCreate"),
    },
    {
      key: "create-role",
      label: "Create Role",
      href: "/roles-permissions/new",
      icon: Plus,
      visible: hasPermission("roles_permissions", "canCreate"),
    },
  ].filter((action) => action.visible);

  if (actions.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Quick actions
      </h2>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.key}
            variant="outline"
            nativeButton={false}
            render={<Link href={action.href} />}
          >
            <action.icon className="size-4" />
            {action.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
