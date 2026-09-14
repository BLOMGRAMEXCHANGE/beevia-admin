"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { cn } from "@/lib/utils";
import {
  EMPTY_CELL,
  formatReportValue,
  isBadgeColumn,
  isIdColumn,
  isLongText,
  readCell,
  toneForValue,
  type ValueLabels,
} from "@/features/reports/presentation";
import type { ReportColumn, ReportRow } from "@/features/reports/types";

const PAGE_SIZE = 25;

function Cell({
  column,
  row,
  labels,
}: {
  column: ReportColumn;
  row: ReportRow;
  labels: ValueLabels;
}) {
  const value = readCell(row, column.key);
  const currency = readCell(row, "currency");
  const text = formatReportValue(column.key, value, {
    currency: typeof currency === "string" ? currency : undefined,
    labels,
  });

  if (text === EMPTY_CELL) {
    return <span className="text-muted-foreground">{EMPTY_CELL}</span>;
  }

  if (isBadgeColumn(column.key)) {
    return <StatusBadge tone={toneForValue(value)}>{text}</StatusBadge>;
  }

  if (isIdColumn(column.key)) {
    // Identifiers are long and rarely read in full — clamp them, but keep the
    // whole value available on hover and in the copy buffer.
    return (
      <span
        title={String(value)}
        className="block max-w-[16ch] truncate font-mono text-xs text-muted-foreground"
      >
        {text}
      </span>
    );
  }

  if (isLongText(text)) {
    return (
      <span className="block min-w-[28ch] max-w-[56ch] whitespace-normal">
        {text}
      </span>
    );
  }

  return <span className="whitespace-nowrap">{text}</span>;
}

/**
 * The preview table. Columns come from the report itself, so this renders any
 * report type — including ones added to the backend later — without a
 * per-type component. Rows are paginated client-side: the preview is already a
 * bounded sample, the full result set lives in the CSV download.
 */
export function ReportTable({
  columns,
  rows,
  labels = {},
}: {
  columns: ReportColumn[];
  rows: ReportRow[];
  /** Value labels from the report type's filter options. */
  labels?: ValueLabels;
}) {
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = rows.slice(start, start + PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn("whitespace-nowrap", {
                    "text-muted-foreground": isIdColumn(column.key),
                  })}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row, index) => (
              <TableRow key={start + index}>
                {columns.map((column) => (
                  <TableCell key={column.key} className="align-top">
                    <Cell column={column} row={row} labels={labels} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {rows.length > PAGE_SIZE && (
        <div className="flex flex-col gap-2">
          <PaginationControls
            page={safePage}
            pageCount={pageCount}
            onPageChange={setPage}
          />
          <p className="text-xs text-muted-foreground">
            Showing {start + 1}–{Math.min(start + PAGE_SIZE, rows.length)} of{" "}
            {rows.length} preview rows
          </p>
        </div>
      )}
    </div>
  );
}
