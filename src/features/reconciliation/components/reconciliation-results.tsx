import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { DiscrepancyTypeBadge } from "@/features/reconciliation/components/discrepancy-type-badge";
import { DISCREPANCY_LABEL } from "@/features/reconciliation/constants";
import { formatNaira } from "@/lib/format";
import type {
  DiscrepancyType,
  ReconciliationDiscrepancy,
  ReconciliationRun,
} from "@/features/reconciliation/types";

const DISCREPANCY_ORDER: DiscrepancyType[] = [
  "missing_in_anchor",
  "missing_in_beevia",
  "amount_mismatch",
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SummaryCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: React.ReactNode;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p className="font-heading text-2xl font-bold tracking-tight tabular-nums">
          {value}
        </p>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

const columns: DataTableColumn<ReconciliationDiscrepancy>[] = [
  { header: "Type", cell: (row) => <DiscrepancyTypeBadge type={row.type} /> },
  {
    header: "Reference",
    cell: (row) => (
      <span className="font-mono text-xs font-medium">{row.reference}</span>
    ),
  },
  {
    header: "User",
    cell: (row) => (
      <Link
        href={`/users/${row.user.id}`}
        className="flex flex-col hover:underline"
      >
        <span className="font-medium">{row.user.name}</span>
        <span className="text-xs text-muted-foreground">
          {row.user.username}
        </span>
      </Link>
    ),
  },
  {
    header: "Beevia amount",
    className: "text-right tabular-nums",
    cell: (row) =>
      row.beeviaAmount === null ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        formatNaira(row.beeviaAmount)
      ),
  },
  {
    header: "Anchor amount",
    className: "text-right tabular-nums",
    cell: (row) =>
      row.anchorAmount === null ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        formatNaira(row.anchorAmount)
      ),
  },
  {
    header: "Date",
    cell: (row) => (
      <span className="text-muted-foreground">{formatDate(row.date)}</span>
    ),
  },
];

export function ReconciliationResults({ run }: { run: ReconciliationRun }) {
  const countsByType = DISCREPANCY_ORDER.reduce<
    Record<DiscrepancyType, number>
  >(
    (acc, type) => {
      acc[type] = run.discrepancies.filter((d) => d.type === type).length;
      return acc;
    },
    { missing_in_anchor: 0, missing_in_beevia: 0, amount_mismatch: 0 }
  );

  const matchRate =
    run.totalCompared > 0
      ? `${Math.round((run.matched / run.totalCompared) * 100)}% of compared`
      : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Compared"
          value={run.totalCompared.toLocaleString("en-NG")}
        />
        <SummaryCard
          title="Matched"
          value={run.matched.toLocaleString("en-NG")}
          hint={matchRate}
        />
        <SummaryCard
          title="Discrepancies Found"
          value={run.discrepancies.length.toLocaleString("en-NG")}
          hint={
            <ul className="flex flex-col gap-0.5">
              {DISCREPANCY_ORDER.map((type) => (
                <li key={type}>
                  {countsByType[type]} {DISCREPANCY_LABEL[type]}
                </li>
              ))}
            </ul>
          }
        />
      </div>

      {run.discrepancies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 className="size-5" />
            </div>
            <p className="font-heading text-base font-medium">
              No discrepancies found
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Beevia and Anchor records match for this period. All{" "}
              {run.totalCompared.toLocaleString("en-NG")} compared transactions
              reconciled cleanly.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <CardTitle className="text-base">Discrepancies</CardTitle>
            <Badge variant="secondary">{run.discrepancies.length}</Badge>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={run.discrepancies}
              getRowId={(row) => row.id}
              emptyMessage="No discrepancies."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
