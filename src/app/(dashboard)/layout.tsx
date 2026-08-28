"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  BarChart3,
  FileText,
  KeyRound,
  LayoutGrid,
  Mail,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RoleGate } from "@/components/shared/role-gate";
import { NotificationBell } from "@/components/shared/notification-bell";
import { AccountMenu } from "@/components/shared/account-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCurrentAdmin } from "@/hooks/use-current-admin";
import type { AdminRole } from "@/types/admin";
import logo from "../../../public/logo.png";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allow?: AdminRole[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/users", label: "Users", icon: Users },
  { href: "/chats", label: "Chats", icon: MessageSquare },
  { href: "/wallets", label: "Wallets", icon: Wallet },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/kyc", label: "KYC", icon: ShieldCheck },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  {
    href: "/roles-permissions",
    label: "Roles & Permissions",
    icon: UserCog,
    allow: ["super_admin"],
  },
  {
    href: "/admin-accounts",
    label: "Admin Accounts",
    icon: KeyRound,
    allow: ["super_admin"],
  },
];

function useGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
        active && "bg-muted text-foreground"
      )}
    >
      <item.icon className="size-4" />
      {item.label}
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: admin } = useCurrentAdmin();
  const greeting = useGreeting();
  const firstName = admin?.name?.split(" ")[0];

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <aside className="flex h-full w-60 shrink-0 flex-col overflow-hidden border-r bg-card py-4">
        <div className="mb-6 flex shrink-0 items-center gap-2 px-4">
          <Image
            src={logo}
            alt="Beevia"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-heading text-lg font-bold">Beevia</span>
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const link = (
              <NavLink key={item.href} item={item} active={active} />
            );
            return item.allow ? (
              <RoleGate key={item.href} allow={item.allow}>
                {link}
              </RoleGate>
            ) : (
              link
            );
          })}
        </nav>
        <div className="mt-2 shrink-0 border-t px-3 pt-2">
          <NavLink
            item={{
              href: "/settings",
              label: "System Settings",
              icon: Settings,
            }}
            active={pathname.startsWith("/settings")}
          />
        </div>
      </aside>
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-white px-6">
          <p className="shrink-0 text-sm text-muted-foreground">
            {greeting}
            {firstName ? ` ${firstName}` : ""}
          </p>
          <div className="relative mx-auto w-full max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            {/* TODO: wire to a real global-search endpoint once the API exists. */}
            <Input placeholder="Search for…" className="pl-8" />
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {/* TODO: wire to a real messages/inbox feature once it exists. */}
            <Button variant="ghost" size="icon" aria-label="Messages">
              <Mail className="size-5" />
            </Button>
            <NotificationBell />
            <AccountMenu />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/20 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
