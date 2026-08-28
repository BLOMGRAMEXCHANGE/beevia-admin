"use client";

import { useRouter } from "next/navigation";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { TransferStatusBadge } from "@/features/pending-transfers/components/transfer-status-badge";
import { windowLabel } from "@/features/pending-transfers/overdue";
import { formatNaira } from "@/lib/format";
import type { DecoratedTransfer } from "@/features/pending-transfers/types";

interface TransfersTableProps {
  transfers: DecoratedTransfer[];
  /**
   * "overdue" shows the "how far past the window" column (View 1).
   * "results" shows the status column instead (View 2).
   */
  variant: "overdue" | "results";
  emptyMessage?: string;
}

function PartyCell({ name, username }: { name: string; username: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-medium">{name}</span>
      <span className="text-xs text-muted-foreground">{username}</span>
    </div>
  );
}

export function TransfersTable({
  transfers,
  variant,
  emptyMessage = "No transfers.",
}: TransfersTableProps) {
  const router = useRouter();

  const columns: DataTableColumn<DecoratedTransfer>[] = [
    {
      header: "Reference",
      cell: (transfer) => (
        <span className="font-mono text-xs font-medium">
          {transfer.reference}
        </span>
      ),
    },
    {
      header: "Sender",
      cell: (transfer) => <PartyCell {...transfer.sender} />,
    },
    {
      header: "Recipient",
      cell: (transfer) => <PartyCell {...transfer.recipient} />,
    },
    {
      header: "Amount",
      className: "text-right tabular-nums",
      cell: (transfer) => formatNaira(transfer.amount),
    },
    variant === "overdue"
      ? {
          header: "Past 24h window",
          cell: (transfer) => (
            <span className="font-medium text-red-700 dark:text-red-400">
              {windowLabel(transfer)}
            </span>
          ),
        }
      : {
          header: "Status",
          cell: (transfer) => <TransferStatusBadge status={transfer.status} />,
        },
    {
      header: "",
      className: "text-right",
      cell: () => (
        <span className="text-xs font-medium text-primary">View →</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={transfers}
      getRowId={(transfer) => transfer.reference}
      emptyMessage={emptyMessage}
      onRowClick={(transfer) =>
        router.push(`/transactions/${transfer.reference}`)
      }
    />
  );
}
