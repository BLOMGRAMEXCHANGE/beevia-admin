"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TransferStatusBadge } from "@/features/pending-transfers/components/transfer-status-badge";
import { useTransferDetail } from "@/features/pending-transfers/api";
import {
  KIND_LABEL,
  RESOLUTION_LABEL,
} from "@/features/pending-transfers/constants";
import {
  formatDuration,
  windowLabel,
} from "@/features/pending-transfers/overdue";
import { formatNaira } from "@/lib/format";
import type {
  DecoratedTransfer,
  TransferParty,
} from "@/features/pending-transfers/types";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function PartyCard({ role, party }: { role: string; party: TransferParty }) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-2 pt-3">
        <span className="text-xs font-medium text-muted-foreground">
          {role}
        </span>
        <div className="flex flex-col">
          <span className="font-medium">{party.name}</span>
          <span className="text-xs text-muted-foreground">
            {party.username} · {party.phone}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-1 w-fit"
          nativeButton={false}
          render={<Link href={`/users/${party.id}`} />}
        >
          Open customer detail <ArrowRight className="size-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}

function TimingBlock({ transfer }: { transfer: DecoratedTransfer }) {
  if (transfer.status === "pending") {
    return (
      <div
        className={
          transfer.isOverdue
            ? "flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
            : "flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
        }
      >
        {transfer.isOverdue ? (
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        ) : (
          <Clock className="mt-0.5 size-4 shrink-0" />
        )}
        <div className="flex flex-col gap-0.5 text-sm">
          <span className="font-medium">
            {transfer.isOverdue
              ? "Past the 24-hour auto-refund window"
              : "Awaiting the recipient's decision"}
          </span>
          <span>
            {windowLabel(transfer)} · auto-refund due{" "}
            {formatDateTime(transfer.deadlineAt)}
          </span>
          {transfer.isOverdue && (
            <span>
              This transfer should already have been auto-refunded — flag if the
              refund job is not catching up.
            </span>
          )}
        </div>
      </div>
    );
  }

  const elapsedToResolution =
    transfer.resolvedAt !== null
      ? new Date(transfer.resolvedAt).getTime() -
        new Date(transfer.createdAt).getTime()
      : null;

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      <Field label="Resolved at">
        {transfer.resolvedAt ? formatDateTime(transfer.resolvedAt) : "—"}
      </Field>
      <Field label="Resolution method">
        {transfer.resolutionMethod
          ? RESOLUTION_LABEL[transfer.resolutionMethod]
          : "—"}
      </Field>
      {elapsedToResolution !== null && (
        <Field label="Time from send to resolution">
          {formatDuration(elapsedToResolution)}
        </Field>
      )}
    </dl>
  );
}

export function TransferDetail({ reference }: { reference: string }) {
  const { data, isLoading, isError } = useTransferDetail(reference);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="pt-3 text-sm text-muted-foreground">
          No transfer found for reference{" "}
          <span className="font-mono">{reference}</span>. It may not have gone
          through the pending accept/decline system.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row flex-wrap items-center gap-3 space-y-0">
          <CardTitle className="font-mono text-base">
            {data.reference}
          </CardTitle>
          <TransferStatusBadge status={data.status} />
          <span className="ml-auto text-lg font-semibold tabular-nums">
            {formatNaira(data.amount)}
          </span>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Field label="Transfer type">{KIND_LABEL[data.kind]}</Field>
            <Field label="Entered pending state">
              {formatDateTime(data.createdAt)}
            </Field>
          </dl>
          <TimingBlock transfer={data} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <PartyCard role="Sender" party={data.sender} />
        <PartyCard role="Recipient" party={data.recipient} />
      </div>
    </div>
  );
}
