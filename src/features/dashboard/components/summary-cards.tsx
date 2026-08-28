"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardCapability } from "@/features/dashboard/capability";
import { useMockResource } from "@/features/dashboard/hooks/use-mock-resource";
import {
  MOCK_ADMIN_ACCOUNTS_SUMMARY,
  MOCK_ROLES_SUMMARY,
  MOCK_USERS_SUMMARY,
  SUMMARY_CARD_DELAYS,
  type AdminAccountsSummary,
  type RolesSummary,
  type UsersSummary,
} from "@/features/dashboard/mock/summary";

const numberFormat = new Intl.NumberFormat("en-US");

function CardShell({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
          {title}
          <Link
            href={href}
            className="text-xs font-normal text-primary hover:underline"
          >
            View
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function CardLoading() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-4 w-full" />
    </div>
  );
}

function CardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <AlertTriangle className="size-4 text-destructive" />
        Couldn&apos;t load this metric.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="size-3.5" />
        Retry
      </Button>
    </div>
  );
}

function Metric({ value }: { value: number }) {
  return (
    <p className="font-heading text-3xl font-bold tracking-tight">
      {numberFormat.format(value)}
    </p>
  );
}

function UsersCard() {
  const { status, data, retry } = useMockResource<UsersSummary>({
    data: MOCK_USERS_SUMMARY,
    delayMs: SUMMARY_CARD_DELAYS.users,
  });

  return (
    <CardShell title="Users" href="/users">
      {status === "loading" && <CardLoading />}
      {status === "error" && <CardError onRetry={retry} />}
      {status === "success" && data && (
        <div className="flex flex-col gap-3">
          <Metric value={data.total} />
          <div className="grid grid-cols-3 gap-2 text-xs">
            <Breakdown
              label="Verified"
              value={data.verified}
              tone="text-emerald-600"
            />
            <Breakdown
              label="Pending"
              value={data.pending}
              tone="text-amber-600"
            />
            <Breakdown
              label="Failed"
              value={data.failed}
              tone="text-destructive"
            />
          </div>
        </div>
      )}
    </CardShell>
  );
}

function Breakdown({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`font-heading text-sm font-semibold ${tone}`}>
        {numberFormat.format(value)}
      </span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function AdminAccountsCard() {
  const { status, data, retry } = useMockResource<AdminAccountsSummary>({
    data: MOCK_ADMIN_ACCOUNTS_SUMMARY,
    delayMs: SUMMARY_CARD_DELAYS.adminAccounts,
    failFirstLoad: true,
  });

  return (
    <CardShell title="Admin Accounts" href="/admin-accounts">
      {status === "loading" && <CardLoading />}
      {status === "error" && <CardError onRetry={retry} />}
      {status === "success" && data && <Metric value={data.total} />}
    </CardShell>
  );
}

function RolesCard() {
  const { status, data, retry } = useMockResource<RolesSummary>({
    data: MOCK_ROLES_SUMMARY,
    delayMs: SUMMARY_CARD_DELAYS.roles,
  });

  return (
    <CardShell title="Roles" href="/roles-permissions">
      {status === "loading" && <CardLoading />}
      {status === "error" && <CardError onRetry={retry} />}
      {status === "success" && data && <Metric value={data.total} />}
    </CardShell>
  );
}

export function SummaryCards() {
  const { hasPermission } = useDashboardCapability();

  const cards = [
    {
      key: "users",
      visible: hasPermission("users", "canView"),
      node: <UsersCard />,
    },
    {
      key: "admin_accounts",
      visible: hasPermission("admin_accounts", "canView"),
      node: <AdminAccountsCard />,
    },
    {
      key: "roles",
      visible: hasPermission("roles_permissions", "canView"),
      node: <RolesCard />,
    },
  ].filter((card) => card.visible);

  if (cards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          You don&apos;t have access to any summary metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.key}>{card.node}</div>
      ))}
    </div>
  );
}
