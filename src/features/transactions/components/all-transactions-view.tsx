"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ListFilter, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";
import {
  TRANSACTION_STATUS_LABEL,
  TRANSACTION_TYPE_OPTIONS,
} from "@/features/wallet/constants";
import { TransactionStatusBadge } from "@/features/wallet/components/transaction-status-badge";
import { TransactionTypeBadge } from "@/features/wallet/components/transaction-type-badge";
import type {
  WalletTransactionStatus,
  WalletTransactionType,
} from "@/features/wallet/types";
import {
  ALL_TRANSACTIONS_PAGE_LIMIT,
  useAllTransactions,
} from "@/features/transactions/api";
import type {
  PlatformTransaction,
  PlatformTransactionFilters,
} from "@/features/transactions/types";

const STATUS_OPTIONS = Object.entries(TRANSACTION_STATUS_LABEL) as [
  WalletTransactionStatus,
  string,
][];

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SignedAmount({ transaction }: { transaction: PlatformTransaction }) {
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

const EMPTY_TYPES: WalletTransactionType[] = [];
const EMPTY_STATUSES: WalletTransactionStatus[] = [];

export function AllTransactionsView() {
  const [userQuery, setUserQuery] = useState("");
  const [types, setTypes] = useState<WalletTransactionType[]>(EMPTY_TYPES);
  const [statuses, setStatuses] =
    useState<WalletTransactionStatus[]>(EMPTY_STATUSES);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [debouncedUser, setDebouncedUser] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedUser(userQuery.trim());
      setPage(1);
    }, 400);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [userQuery]);

  const filters: PlatformTransactionFilters = useMemo(
    () => ({
      user: debouncedUser || undefined,
      types: types.length > 0 ? types : undefined,
      statuses: statuses.length > 0 ? statuses : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [debouncedUser, types, statuses, dateFrom, dateTo]
  );

  const { data, isLoading, isError, isPlaceholderData } = useAllTransactions(
    filters,
    page,
    ALL_TRANSACTIONS_PAGE_LIMIT
  );

  const hasActiveFilters =
    Boolean(debouncedUser) ||
    types.length > 0 ||
    statuses.length > 0 ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  function toggleType(value: WalletTransactionType, checked: boolean) {
    setTypes((current) =>
      checked ? [...current, value] : current.filter((v) => v !== value)
    );
    setPage(1);
  }

  function toggleStatus(value: WalletTransactionStatus, checked: boolean) {
    setStatuses((current) =>
      checked ? [...current, value] : current.filter((v) => v !== value)
    );
    setPage(1);
  }

  function clearFilters() {
    setUserQuery("");
    setDebouncedUser("");
    setTypes(EMPTY_TYPES);
    setStatuses(EMPTY_STATUSES);
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  const columns: DataTableColumn<PlatformTransaction>[] = [
    {
      header: "User",
      cell: (txn) => (
        <Link
          href={`/users/${txn.user.id}`}
          className="flex flex-col hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          <span className="font-medium">{txn.user.name}</span>
          <span className="text-xs text-muted-foreground">
            {txn.user.username}
          </span>
        </Link>
      ),
    },
    { header: "Type", cell: (txn) => <TransactionTypeBadge type={txn.type} /> },
    { header: "Amount", cell: (txn) => <SignedAmount transaction={txn} /> },
    { header: "Counterparty", cell: (txn) => txn.counterparty },
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

  const typeLabel =
    types.length === 0
      ? "All types"
      : types.length === 1
        ? TRANSACTION_TYPE_OPTIONS.find((o) => o.value === types[0])?.label
        : `${types.length} types`;

  const statusLabel =
    statuses.length === 0
      ? "All statuses"
      : statuses.length === 1
        ? TRANSACTION_STATUS_LABEL[statuses[0]]
        : `${statuses.length} statuses`;

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <CardTitle className="text-base">All transactions</CardTitle>
        {data && <Badge variant="secondary">{data.pagination.total}</Badge>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex max-w-sm flex-col gap-1.5">
            <Label htmlFor="all-txn-user">User</Label>
            <InputGroup>
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                id="all-txn-user"
                placeholder="Name, username, or phone"
                value={userQuery}
                onChange={(event) => setUserQuery(event.target.value)}
              />
            </InputGroup>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" size="sm" />}
              >
                <ListFilter data-icon="inline-start" className="size-4" />
                {typeLabel}
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

            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" size="sm" />}
              >
                <ListFilter data-icon="inline-start" className="size-4" />
                {statusLabel}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {STATUS_OPTIONS.map(([value, label]) => (
                  <DropdownMenuCheckboxItem
                    key={value}
                    checked={statuses.includes(value)}
                    onCheckedChange={(checked) =>
                      toggleStatus(value, checked === true)
                    }
                  >
                    {label}
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
                  setPage(1);
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
                  setPage(1);
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
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Something went wrong loading transactions. Please try again.
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
                  : "No transactions found."
              }
            />
            <PaginationControls
              page={data?.pagination.page ?? page}
              pageCount={data?.pagination.totalPages ?? 1}
              onPageChange={setPage}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
