"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { buildAdminActivityReport } from "@/features/reports/mock-data";
import { ReportStatCard } from "@/features/reports/components/report-stat-card";
import { presentActivity } from "@/features/dashboard/mock/activity";
import type { ActivityEvent } from "@/features/dashboard/mock/activity";
import type { GeneratedReport } from "@/features/reports/types";

const numberFormat = new Intl.NumberFormat("en-US");
const PAGE_SIZE = 15;

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * One audit-list row — the exact icon + description-line format from Dashboard
 * Home's Recent Activity feed (`presentActivity`), including its click-through
 * to the relevant record. Timestamp is absolute (not relative) since this is a
 * point-in-time report that can span months.
 */
function ActionRow({ event }: { event: ActivityEvent }) {
  const presented = presentActivity(event);
  const Icon = presented.icon;
  return (
    <Link
      href={presented.href}
      className="-mx-2 flex items-start gap-3 rounded-md px-2 py-2.5 hover:bg-muted"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm">{presented.line}</span>
        <span className="text-xs text-muted-foreground">
          {formatTimestamp(event.createdAt)}
        </span>
      </span>
    </Link>
  );
}

/**
 * Admin Activity / Audit report body. Unlike RP2/RP3 this is a chronological
 * list of individual events — the list IS the report — with a single header
 * count and full pagination across the whole result set.
 */
export function AdminActivityReportContent({
  report,
}: {
  report: GeneratedReport;
}) {
  const { totalActions, events } = buildAdminActivityReport(
    report.params,
    Date.parse(report.generatedAt)
  );
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = events.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header stat */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportStatCard
          title="Total Admin Actions"
          value={numberFormat.format(totalActions)}
        />
      </div>

      {/* 2. Chronological action list */}
      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center">
          <ClipboardList className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium">
            No admin actions found for this period
          </p>
          <p className="max-w-xs text-xs text-muted-foreground">
            No matching admin or user changes were recorded for the selected
            date range and action type.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col divide-y">
            {visible.map((event) => (
              <ActionRow key={event.id} event={event} />
            ))}
          </div>
          {/* 3. Pagination across the full result set (not a DH2-style cap). */}
          <PaginationControls
            page={safePage}
            pageCount={pageCount}
            onPageChange={setPage}
          />
          <p className="text-xs text-muted-foreground">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, events.length)} of {events.length}
          </p>
        </div>
      )}
    </div>
  );
}
