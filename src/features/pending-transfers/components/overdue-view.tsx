"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOverdueTransfers } from "@/features/pending-transfers/api";
import { TransfersTable } from "@/features/pending-transfers/components/transfers-table";

export function OverdueView() {
  const { data, isLoading, isError } = useOverdueTransfers();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Card>
          <CardContent className="flex flex-col gap-2 pt-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-2 text-sm text-muted-foreground">
          Something went wrong checking for overdue transfers. Please try again.
        </CardContent>
      </Card>
    );
  }

  const overdue = data ?? [];

  if (overdue.length === 0) {
    // Calm, clearly-normal empty state. "Nothing overdue" is the GOOD outcome —
    // green, reassuring, and visually distinct from the error state above.
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <ShieldCheck className="size-5" />
          </div>
          <p className="font-heading text-base font-medium">
            No overdue transfers
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Every pending transfer is still inside its 24-hour window. The
            auto-refund system is running normally.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="alert"
        className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
      >
        <AlertTriangle className="mt-0.5 size-5 shrink-0" />
        <div className="flex flex-col gap-0.5">
          <p className="font-heading text-sm font-semibold">
            {overdue.length} pending transfer{overdue.length === 1 ? "" : "s"}{" "}
            past the 24-hour auto-refund window
          </p>
          <p className="text-sm">
            These should have auto-refunded by now. If this list is non-empty,
            the 24-hour refund job may be failing in production — investigate
            before the backlog grows.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <CardTitle className="text-base">Overdue pending transfers</CardTitle>
          <Badge variant="secondary">{overdue.length}</Badge>
        </CardHeader>
        <CardContent>
          <TransfersTable transfers={overdue} variant="overdue" />
        </CardContent>
      </Card>
    </div>
  );
}
