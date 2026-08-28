"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNaira } from "@/lib/format";
import {
  useDashboardCapability,
  useDashboardRole,
} from "@/features/dashboard/capability";
import {
  useFinancialSummary,
  type FinancialSummary,
} from "@/features/dashboard/mock/financial";

const numberFormat = new Intl.NumberFormat("en-US");

function SectionShell({ children }: { children: React.ReactNode }) {
  return (
    <section aria-label="Financial summary" className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Financial summary
      </h2>
      {children}
    </section>
  );
}

function StatCard({
  title,
  children,
  flagged = false,
}: {
  title: string;
  children: React.ReactNode;
  flagged?: boolean;
}) {
  return (
    <Card
      className={cn(
        flagged && "bg-amber-50/60 ring-amber-400/60 dark:bg-amber-950/20"
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          {flagged && <AlertTriangle className="size-4 text-amber-600" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Metric({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-heading text-2xl font-bold tracking-tight">{children}</p>
  );
}

function SectionSkeleton({ cardCount }: { cardCount: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: cardCount }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TotalBalanceCard({ data }: { data: FinancialSummary }) {
  return (
    <StatCard title="Total Wallet Balance">
      <Metric>{formatNaira(data.totalBalance)}</Metric>
      <p className="mt-1 text-xs text-muted-foreground">
        Entire platform float
      </p>
    </StatCard>
  );
}

function Transactions24hCard({ data }: { data: FinancialSummary }) {
  const { count, volume } = data.transactions24h;
  return (
    <StatCard title="Transactions (Last 24h)">
      <Metric>{numberFormat.format(count)}</Metric>
      <p className="mt-1 text-xs text-muted-foreground">
        {numberFormat.format(count)} transactions · {formatNaira(volume)}
      </p>
    </StatCard>
  );
}

/** @internal exported for tests */
export function VirtualCardsCard({ data }: { data: FinancialSummary }) {
  const { total, active } = data.cardsIssued;
  // Label depends on whether the backend exposes card status at all.
  const showActive = typeof active === "number";
  return (
    <StatCard
      title={showActive ? "Active Virtual Cards" : "Total Virtual Cards Issued"}
    >
      <Metric>{numberFormat.format(showActive ? active! : total)}</Metric>
      {showActive && (
        <p className="mt-1 text-xs text-muted-foreground">
          of {numberFormat.format(total)} issued
        </p>
      )}
    </StatCard>
  );
}

/** @internal exported for tests */
export function PendingTransfersCard({ data }: { data: FinancialSummary }) {
  const { total, overdue } = data.pendingTransfers;
  const flagged = overdue > 0;
  return (
    <StatCard title="Pending Transfers" flagged={flagged}>
      <Metric>{numberFormat.format(total)}</Metric>
      <p className="mt-1 text-xs text-muted-foreground">
        {numberFormat.format(total)} pending
        {flagged && (
          <>
            {" · "}
            <span className="font-semibold text-amber-700 dark:text-amber-400">
              {numberFormat.format(overdue)} overdue
            </span>
          </>
        )}
      </p>
    </StatCard>
  );
}

/**
 * Financial summary cards. Replaces the old "coming soon" placeholder.
 *
 * Gating:
 * - Whole section requires wallets:canView (mock wallet/transaction permission).
 * - Card 1 additionally requires Super Admin — this is the entire platform
 *   float, not one user's balance. See summary note: the exact rule is still
 *   pending final sign-off.
 */
export function FinancialSection() {
  const { hasPermission } = useDashboardCapability();
  const { isSuperAdmin } = useDashboardRole();
  const { status, data } = useFinancialSummary();

  if (!hasPermission("wallets", "canView")) return null;

  const cardCount = isSuperAdmin ? 4 : 3;

  if (status !== "success" || !data) {
    return (
      <SectionShell>
        <SectionSkeleton cardCount={cardCount} />
      </SectionShell>
    );
  }

  return (
    <SectionShell>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isSuperAdmin && <TotalBalanceCard data={data} />}
        <Transactions24hCard data={data} />
        <VirtualCardsCard data={data} />
        <PendingTransfersCard data={data} />
      </div>
    </SectionShell>
  );
}
