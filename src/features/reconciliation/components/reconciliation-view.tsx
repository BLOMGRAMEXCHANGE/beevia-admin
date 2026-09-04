"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatNaira, formatRelativeTime, humanizeToken } from "@/lib/format";
import {
  ReconciliationApiError,
  usePoolReconciliation,
} from "@/features/reconciliation/api";

function StatBlock({ title, value }: { title: string; value: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-2xl font-bold tracking-tight tabular-nums">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Pool-level Anchor solvency check — `GET /admin/reconciliation/pool`. This is
 * the platform-wide view: total ledger liability vs. what Anchor's pool
 * account actually holds. For a specific user's own reconciliation, see the
 * "Anchor Reconciliation" card on that user's profile.
 */
export function ReconciliationView() {
  const { data, isLoading, isError, error, refetch, isRefetching } =
    usePoolReconciliation();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="max-w-2xl text-xs text-muted-foreground">
          Compares the total balance Beevia&apos;s ledger owes across every user
          wallet against what Anchor&apos;s pool account actually holds.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
        >
          <RefreshCw
            className={isRefetching ? "size-4 animate-spin" : "size-4"}
          />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <AlertTriangle className="size-6 text-destructive" />
            <p className="text-sm text-muted-foreground">
              {error instanceof ReconciliationApiError
                ? error.message
                : "Couldn't check pool reconciliation. Please try again."}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        data && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge tone={data.solvent ? "green" : "red"}>
                {humanizeToken(data.status)}
              </StatusBadge>
              <StatusBadge tone={data.balanceMatches ? "green" : "amber"}>
                {data.balanceMatches ? "Balances match" : "Balances differ"}
              </StatusBadge>
              <span className="text-xs text-muted-foreground">
                Checked {formatRelativeTime(data.generatedAt)}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatBlock
                title="Ledger Liability"
                value={formatNaira(data.ledgerLiability)}
              />
              <StatBlock
                title="Pool Balance"
                value={formatNaira(data.poolBalance)}
              />
              <StatBlock
                title="Difference"
                value={formatNaira(data.difference)}
              />
              <StatBlock
                title="User Wallets"
                value={data.userWalletCount.toLocaleString("en-NG")}
              />
            </div>

            {data.notes.length > 0 && (
              <ul className="flex flex-col gap-1 rounded-lg border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
                {data.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            )}

            <p className="text-xs text-muted-foreground">
              Pool account {data.poolAccountId}
            </p>
          </div>
        )
      )}
    </div>
  );
}
