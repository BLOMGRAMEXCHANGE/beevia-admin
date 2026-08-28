"use client";

import { useState } from "react";
import { Loader2, ScanSearch, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ReconciliationResults } from "@/features/reconciliation/components/reconciliation-results";
import { useRunReconciliation } from "@/features/reconciliation/api";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toDateInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function firstOfThisMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
}

export function ReconciliationView() {
  const [dateFrom, setDateFrom] = useState(firstOfThisMonth);
  const [dateTo, setDateTo] = useState(() => toDateInput(new Date()));
  const [user, setUser] = useState("");

  const { mutate, data: run, isPending, isError } = useRunReconciliation();

  function handleRun() {
    mutate({ dateFrom, dateTo, user: user.trim() || undefined });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
        Compares Beevia&apos;s ledger against Anchor&apos;s records for the
        selected period. This is a standard three-way comparison shape — the
        exact model will need revisiting once Anchor&apos;s reconciliation API
        is confirmed.
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Run reconciliation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rec-from">From</Label>
              <Input
                id="rec-from"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rec-to">To</Label>
              <Input
                id="rec-to"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="rec-user">Scope to user (optional)</Label>
              <InputGroup>
                <InputGroupAddon>
                  <Search className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id="rec-user"
                  placeholder="Name, username, or phone"
                  value={user}
                  onChange={(event) => setUser(event.target.value)}
                />
              </InputGroup>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleRun} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Running reconciliation…
                </>
              ) : (
                <>
                  <ScanSearch className="size-4" />
                  Run Reconciliation
                </>
              )}
            </Button>
            {run && !isPending && (
              <span className="text-xs text-muted-foreground">
                Last run {new Date(run.ranAt).toLocaleString("en-NG")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {isPending ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <p className="text-sm font-medium">Running reconciliation…</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Pulling Beevia ledger entries and Anchor records for the selected
              period and comparing them. This can take a moment.
            </p>
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="pt-2 text-sm text-muted-foreground">
            The reconciliation run failed to complete. Please try again.
          </CardContent>
        </Card>
      ) : !run ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Choose a period (and, optionally, a single user) and run
            reconciliation to compare Beevia and Anchor records.
          </CardContent>
        </Card>
      ) : (
        <ReconciliationResults run={run} />
      )}
    </div>
  );
}
