import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import type { ReconciliationLineItem } from "@/features/reconciliation/types";

function formatItemDate(date: string | null): string {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AmountCell({ item }: { item: ReconciliationLineItem }) {
  // A genuine two-sided mismatch: show both amounts rather than picking one.
  if (item.beeviaAmount !== null && item.anchorAmount !== null) {
    return (
      <div className="flex flex-col text-right text-xs">
        <span>Beevia {formatNaira(item.beeviaAmount)}</span>
        <span className="text-muted-foreground">
          Anchor {formatNaira(item.anchorAmount)}
        </span>
      </div>
    );
  }

  const amount = item.amount ?? item.anchorAmount ?? item.beeviaAmount;
  if (amount === null) {
    return <span className="text-muted-foreground">—</span>;
  }

  const isCredit = item.direction === "credit";
  return (
    <span
      className={cn(
        "tabular-nums",
        isCredit && "text-emerald-600 dark:text-emerald-400"
      )}
    >
      {item.direction ? (isCredit ? "+" : "−") : ""}
      {formatNaira(amount)}
    </span>
  );
}

const columns: DataTableColumn<ReconciliationLineItem>[] = [
  {
    header: "Kind",
    cell: (item) => item.kind ?? "—",
  },
  {
    header: "Reference",
    cell: (item) => (
      <span className="font-mono text-xs">{item.reference ?? "—"}</span>
    ),
  },
  {
    header: "Amount",
    className: "text-right",
    cell: (item) => <AmountCell item={item} />,
  },
  {
    header: "Description",
    cell: (item) => (
      <span className="line-clamp-2 max-w-xs text-xs text-muted-foreground">
        {item.summary || "—"}
      </span>
    ),
  },
  {
    header: "Date",
    cell: (item) => (
      <span className="text-muted-foreground">{formatItemDate(item.date)}</span>
    ),
  },
];

export function ReconciliationBucketTable({
  items,
}: {
  items: ReconciliationLineItem[];
}) {
  return (
    <DataTable
      columns={columns}
      data={items}
      getRowId={(item) => item.id}
      emptyMessage="None."
    />
  );
}
