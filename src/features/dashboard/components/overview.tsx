"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatNaira, formatRelativeTime, humanizeToken } from "@/lib/format";
import {
  useDashboardOverview,
  type DashboardOverview,
} from "@/features/dashboard/api";

const numberFormat = new Intl.NumberFormat("en-US");

function fmtCount(value: number): string {
  return numberFormat.format(value);
}

function fmtNaira(value: number): string {
  return formatNaira(Math.round(value));
}

/* -------------------------------------------------------------------------- */
/*  Building blocks                                                            */
/* -------------------------------------------------------------------------- */

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatCard({
  title,
  value,
  hint,
  href,
  flagged = false,
  icon,
}: {
  title: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  href?: string;
  flagged?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        flagged && "bg-amber-50/60 ring-amber-400/60 dark:bg-amber-950/20"
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-1.5 text-sm font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            {flagged && <AlertTriangle className="size-4 text-amber-600" />}
            {icon}
            {title}
          </span>
          {href && (
            <Link
              href={href}
              className="text-xs font-normal text-primary hover:underline"
            >
              View
            </Link>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p className="font-heading text-2xl font-bold tracking-tight">
          {value}
        </p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function BreakdownCard({
  title,
  entries,
  emptyLabel,
  render,
}: {
  title: string;
  entries: Array<{ key: string; count: number }>;
  emptyLabel: string;
  render?: (value: number) => string;
}) {
  const format = render ?? fmtCount;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <dl className="flex flex-col gap-2">
            {entries.map((entry) => (
              <div
                key={entry.key}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <dt className="text-muted-foreground">
                  {humanizeToken(entry.key)}
                </dt>
                <dd className="font-heading font-semibold">
                  {format(entry.count)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Loading / error                                                            */
/* -------------------------------------------------------------------------- */

function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-28" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function OverviewError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-3 py-2">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="size-4 text-destructive" />
          {message}
        </p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sections                                                                   */
/* -------------------------------------------------------------------------- */

function SummarySection({ data }: { data: DashboardOverview }) {
  const { users, admins, kyc, payouts } = data;
  const kycFlagged = kyc.usersPendingReview > 0 || kyc.usersWithFailedCheck > 0;

  return (
    <Section title="Summary">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Users"
          href="/users"
          value={fmtCount(users.total)}
          hint={
            <>
              {fmtCount(users.active)} active · {fmtCount(users.newThisWeek)}{" "}
              new this week
            </>
          }
        />
        <StatCard
          title="Admin Accounts"
          href="/admin-accounts"
          value={fmtCount(admins.total)}
          hint={
            admins.pendingInvites > 0
              ? `${fmtCount(admins.pendingInvites)} pending invite${
                  admins.pendingInvites === 1 ? "" : "s"
                }`
              : "No pending invites"
          }
        />
        <StatCard
          title="KYC Review"
          href="/kyc"
          value={fmtCount(kyc.usersPendingReview)}
          flagged={kycFlagged}
          hint={
            <>
              pending review · {fmtCount(kyc.usersWithFailedCheck)} failed check
            </>
          }
        />
        <StatCard
          title="Pending Payouts"
          href="/wallets"
          value={fmtCount(payouts.pending)}
          flagged={payouts.pending > 0}
          hint={<>{fmtNaira(payouts.pendingAmountNgn)} awaiting release</>}
        />
      </div>
    </Section>
  );
}

function TreasurySection({ data }: { data: DashboardOverview }) {
  const { treasury, transactions } = data;
  const insolvent = treasury.configured && !treasury.solvent;

  return (
    <Section
      title="Treasury & transactions"
      action={
        treasury.configured ? (
          <Badge
            variant={treasury.solvent ? "secondary" : "destructive"}
            className="gap-1"
          >
            {treasury.solvent ? (
              <ShieldCheck className="size-3" />
            ) : (
              <ShieldAlert className="size-3" />
            )}
            {treasury.solvent ? "Solvent" : "Insolvent"}
          </Badge>
        ) : (
          <Badge variant="outline">Treasury not configured</Badge>
        )
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pool Balance"
          value={fmtNaira(treasury.poolBalanceNgn)}
          hint="Custodial funds held"
        />
        <StatCard
          title="Ledger Liability"
          value={fmtNaira(treasury.ledgerLiabilityNgn)}
          flagged={insolvent}
          hint={
            insolvent
              ? "Exceeds pool balance"
              : "Owed to users across all wallets"
          }
        />
        <StatCard
          title="Transactions Today"
          href="/transactions"
          value={fmtCount(transactions.today.count)}
          hint={<>{fmtNaira(transactions.today.volumeNgn)} volume</>}
        />
        <StatCard
          title="Transactions This Week"
          href="/transactions"
          value={fmtCount(transactions.thisWeek.count)}
          hint={<>{fmtNaira(transactions.thisWeek.volumeNgn)} volume</>}
        />
      </div>
    </Section>
  );
}

function TxnTypeIcon({ type }: { type: string }) {
  if (type === "deposit") {
    return <ArrowDownLeft className="size-4 text-emerald-600" />;
  }
  if (type === "withdrawal") {
    return <ArrowUpRight className="size-4 text-destructive" />;
  }
  return <ArrowUpRight className="size-4 text-muted-foreground" />;
}

function BreakdownsSection({ data }: { data: DashboardOverview }) {
  const { transactions, users } = data;

  return (
    <Section title="Breakdowns">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Volume by type (this month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.byTypeThisMonth.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No transactions this month.
              </p>
            ) : (
              <dl className="flex flex-col gap-2">
                {transactions.byTypeThisMonth.map((entry) => (
                  <div
                    key={entry.key}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <dt className="flex items-center gap-2 text-muted-foreground">
                      <TxnTypeIcon type={entry.key} />
                      {humanizeToken(entry.key)}
                    </dt>
                    <dd className="font-heading font-semibold">
                      {fmtNaira(entry.volumeNgn)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </CardContent>
        </Card>

        <BreakdownCard
          title="Users by path"
          entries={users.byPath}
          emptyLabel="No path data."
        />
        <BreakdownCard
          title="Users by status"
          entries={users.byStatus}
          emptyLabel="No status data."
        />
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Public component                                                           */
/* -------------------------------------------------------------------------- */

export function DashboardOverviewSections() {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useDashboardOverview();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Section title="Summary">
          <CardsSkeleton />
        </Section>
        <Section title="Treasury & transactions">
          <CardsSkeleton />
        </Section>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <OverviewError
        message={error?.message ?? "Couldn't load the dashboard."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="-mt-2 text-xs text-muted-foreground">
        Updated {formatRelativeTime(data.generatedAt)}
        {isFetching && " · refreshing…"}
        <button
          type="button"
          onClick={() => refetch()}
          className="ml-2 inline-flex items-center gap-1 text-primary hover:underline"
        >
          <RefreshCw className="size-3" />
          Refresh
        </button>
      </p>
      <SummarySection data={data} />
      <TreasurySection data={data} />
      <BreakdownsSection data={data} />
    </div>
  );
}
