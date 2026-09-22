"use client";

import { useMemo, useState } from "react";
import { ListFilter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { VirtualAccount } from "@/features/wallet/components/virtual-account";
import { WalletAccountStatusBadge } from "@/features/wallet/components/wallet-account-status-badge";
import { cn } from "@/lib/utils";
import { formatMoney, formatNaira, humanizeToken } from "@/lib/format";
import { TRANSACTIONS_PAGE_LIMIT } from "@/features/wallet/constants";
import { TRANSACTION_TYPE_OPTIONS } from "@/features/transactions/constants";
import { TransactionStatusBadge } from "@/features/transactions/components/transaction-status-badge";
import { TransactionTypeBadge } from "@/features/transactions/components/transaction-type-badge";
import {
  useUserWallets,
  useWalletTransactions,
  WalletApiError,
} from "@/features/wallet/api";
import type {
  WalletLedgerFilters,
  WalletLedgerTransaction,
} from "@/features/wallet/types";

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SignedAmount({
  transaction,
}: {
  transaction: WalletLedgerTransaction;
}) {
  const isCredit = transaction.direction === "credit";
  return (
    <span
      className={cn(
        "font-medium tabular-nums",
        isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
      )}
    >
      {isCredit ? "+" : "−"}
      {formatNaira(transaction.amount)}
    </span>
  );
}

/** The wallet records themselves — balance, status and the virtual account
 * funds are paid into. Balance comes from the wallet record now rather than
 * being inferred from the most recent ledger row. */
function WalletAccounts({ userId }: { userId: string }) {
  const { data, isLoading, isError, error } = useUserWallets(userId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-40" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-muted-foreground">
        {error instanceof WalletApiError && error.status === 403
          ? error.message
          : "Wallet details could not be loaded."}
      </p>
    );
  }

  if (!data || data.wallets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This user has no wallet yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {data.wallets.map((wallet) => (
        <div
          key={wallet.id}
          className="flex flex-wrap items-start justify-between gap-4"
        >
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">
              Current balance
              {data.wallets.length > 1 && ` (${wallet.currency})`}
            </span>
            <span className="font-heading text-3xl font-bold tracking-tight tabular-nums">
              {formatMoney(wallet.balance, wallet.currency)}
            </span>
            <div className="flex items-center gap-2">
              <WalletAccountStatusBadge status={wallet.status} />
              {wallet.provider && (
                <span className="text-xs text-muted-foreground">
                  via {humanizeToken(wallet.provider)}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">
              Virtual account
            </span>
            <VirtualAccount
              account={wallet.virtualAccount}
              className="flex flex-col"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const EMPTY_TYPES: string[] = [];

function TransactionHistory({ userId }: { userId: string }) {
  const [types, setTypes] = useState<string[]>(EMPTY_TYPES);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const filters: WalletLedgerFilters = useMemo(
    () => ({
      types: types.length > 0 ? types : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [types, dateFrom, dateTo]
  );

  const { data, isLoading, isError, error, isPlaceholderData } =
    useWalletTransactions(userId, filters, page, TRANSACTIONS_PAGE_LIMIT);

  const hasActiveFilters =
    types.length > 0 || Boolean(dateFrom) || Boolean(dateTo);

  function resetToFirstPage() {
    setPage(1);
  }

  function toggleType(value: string, checked: boolean) {
    setTypes((current) =>
      checked ? [...current, value] : current.filter((entry) => entry !== value)
    );
    resetToFirstPage();
  }

  function clearFilters() {
    setTypes(EMPTY_TYPES);
    setDateFrom("");
    setDateTo("");
    resetToFirstPage();
  }

  const columns: DataTableColumn<WalletLedgerTransaction>[] = [
    {
      header: "Type",
      cell: (txn) => (
        <TransactionTypeBadge type={txn.type} direction={txn.direction} />
      ),
    },
    {
      header: "Amount",
      cell: (txn) => <SignedAmount transaction={txn} />,
    },
    {
      header: "Description",
      cell: (txn) => (
        <div className="flex flex-col">
          <span>{txn.description || "—"}</span>
          <span className="text-xs text-muted-foreground">{txn.reference}</span>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (txn) => <TransactionStatusBadge status={txn.status} />,
    },
    {
      header: "Timestamp",
      cell: (txn) => (
        <span className="text-muted-foreground">
          {formatTimestamp(txn.timestamp)}
        </span>
      ),
    },
  ];

  const typeButtonLabel =
    types.length === 0
      ? "All types"
      : types.length === 1
        ? TRANSACTION_TYPE_OPTIONS.find((option) => option.value === types[0])
            ?.label
        : `${types.length} types`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Transaction history</span>
        {data && (
          <span className="text-xs text-muted-foreground">
            {data.pagination.total}{" "}
            {data.pagination.total === 1 ? "transaction" : "transactions"}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            <ListFilter data-icon="inline-start" className="size-4" />
            {typeButtonLabel}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Transaction type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {TRANSACTION_TYPE_OPTIONS.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={types.includes(option.value)}
                onCheckedChange={(checked) =>
                  toggleType(option.value, checked === true)
                }
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            aria-label="Transactions from"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
              resetToFirstPage();
            }}
            className="w-36"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            aria-label="Transactions to"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value);
              resetToFirstPage();
            }}
            className="w-36"
          />
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X data-icon="inline-start" className="size-4" />
            Clear filters
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">
          {error instanceof WalletApiError
            ? error.message
            : "Something went wrong loading transactions. Please try again."}
        </p>
      ) : (
        <div
          className={cn(
            "flex flex-col gap-4 transition-opacity",
            isPlaceholderData && "opacity-60"
          )}
        >
          <DataTable
            columns={columns}
            data={data?.transactions ?? []}
            getRowId={(txn) => txn.id}
            emptyMessage={
              hasActiveFilters
                ? "No transactions match these filters."
                : "No transactions yet"
            }
          />
          <PaginationControls
            page={data?.pagination.page ?? page}
            pageCount={data?.pagination.totalPages ?? 1}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

export function WalletSection({ userId }: { userId: string }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <CardTitle className="font-heading text-base">Wallet</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <WalletAccounts userId={userId} />
        <div className="border-t pt-6">
          <TransactionHistory userId={userId} />
        </div>
      </CardContent>
    </Card>
  );
}
