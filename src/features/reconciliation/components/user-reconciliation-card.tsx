"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatNaira, formatRelativeTime, humanizeToken } from "@/lib/format";
import {
  ReconciliationApiError,
  useUserReconciliation,
} from "@/features/reconciliation/api";
import {
  RECONCILIATION_BUCKET_LABEL,
  RECONCILIATION_BUCKET_TONE,
} from "@/features/reconciliation/constants";
import { ReconciliationBucketTable } from "@/features/reconciliation/components/reconciliation-bucket-table";
import type { ReconciliationBucketKey } from "@/features/reconciliation/types";

const BUCKET_ORDER: ReconciliationBucketKey[] = [
  "in_beevia_not_anchor",
  "in_anchor_not_beevia",
  "amount_mismatch",
];

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border bg-card p-3">
      <span className="font-heading text-xl font-semibold tabular-nums">
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function UserReconciliationCard({ userId }: { userId: string }) {
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useUserReconciliation(userId);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="font-heading text-base">
          Anchor Reconciliation
        </CardTitle>
        <div className="flex items-center gap-2">
          {data && (
            <StatusBadge tone={data.status === "matched" ? "green" : "red"}>
              {humanizeToken(data.status)}
            </StatusBadge>
          )}
          {!isLoading && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Refresh reconciliation check"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw
                className={isRefetching ? "size-4 animate-spin" : "size-4"}
              />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-16 w-full" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <AlertTriangle className="size-6 text-destructive" />
            <p className="text-sm text-muted-foreground">
              {error instanceof ReconciliationApiError
                ? error.message
                : "Couldn't check Anchor reconciliation for this user."}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-3.5" />
              Retry
            </Button>
          </div>
        ) : (
          data && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 p-3">
                <div className="flex gap-6 text-sm">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Beevia balance
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatNaira(data.summary.beeviaBalance)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Anchor balance
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatNaira(data.summary.anchorBalance)}
                    </span>
                  </div>
                </div>
                <StatusBadge
                  tone={data.summary.balanceMatches ? "green" : "amber"}
                >
                  {data.summary.balanceMatches
                    ? "Balances match"
                    : "Balances differ"}
                </StatusBadge>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatBlock label="Matched" value={data.summary.matched} />
                {BUCKET_ORDER.map((key) => (
                  <StatBlock
                    key={key}
                    label={RECONCILIATION_BUCKET_LABEL[key]}
                    value={data.summary[bucketSummaryKey(key)]}
                  />
                ))}
              </div>

              {data.notes.length > 0 && (
                <ul className="flex flex-col gap-1 rounded-lg border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
                  {data.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              )}

              {BUCKET_ORDER.filter((key) => data.buckets[key].length > 0).map(
                (key) => (
                  <div key={key} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {RECONCILIATION_BUCKET_LABEL[key]}
                      </span>
                      <StatusBadge tone={RECONCILIATION_BUCKET_TONE[key]}>
                        {data.buckets[key].length}
                      </StatusBadge>
                    </div>
                    <ReconciliationBucketTable items={data.buckets[key]} />
                  </div>
                )
              )}

              <p className="text-xs text-muted-foreground">
                Checked {formatRelativeTime(data.generatedAt)} · Anchor account{" "}
                {data.anchorAccountId}
              </p>
            </>
          )
        )}
      </CardContent>
    </Card>
  );
}

function bucketSummaryKey(
  key: ReconciliationBucketKey
): "amountMismatch" | "inBeeviaNotAnchor" | "inAnchorNotBeevia" {
  switch (key) {
    case "amount_mismatch":
      return "amountMismatch";
    case "in_beevia_not_anchor":
      return "inBeeviaNotAnchor";
    case "in_anchor_not_beevia":
      return "inAnchorNotBeevia";
  }
}
