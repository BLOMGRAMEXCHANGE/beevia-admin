"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { VirtualAccount } from "@/features/wallet/components/virtual-account";
import { WalletAccountStatusBadge } from "@/features/wallet/components/wallet-account-status-badge";
import { WalletsSummaryCards } from "@/features/wallet/components/wallets-summary";
import { useWalletsList, WalletApiError } from "@/features/wallet/api";
import {
  WALLETS_PAGE_LIMIT,
  WALLET_ACCOUNT_STATUS_LABEL,
  WALLET_ACCOUNT_STATUS_OPTIONS,
} from "@/features/wallet/constants";
import { formatMoney, humanizeToken } from "@/lib/format";
import type {
  WalletAccount,
  WalletAccountStatus,
  WalletsFilters,
} from "@/features/wallet/types";

type StatusFilter = WalletAccountStatus | "all";
type CurrencyFilter = string | "all";

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function WalletsTable() {
  const router = useRouter();

  const [rawSearch, setRawSearch] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [currency, setCurrency] = useState<CurrencyFilter>("all");
  const [page, setPage] = useState(1);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function commitSearch(term: string) {
    setCommittedSearch(term.trim());
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setRawSearch(value);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => commitSearch(value), 500);
  }

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const hasActiveFilters =
    Boolean(committedSearch) || status !== "all" || currency !== "all";

  function clearFilters() {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setRawSearch("");
    setCommittedSearch("");
    setStatus("all");
    setCurrency("all");
    setPage(1);
  }

  const filters: WalletsFilters = useMemo(
    () => ({
      search: committedSearch || undefined,
      status: status === "all" ? undefined : status,
      currency: currency === "all" ? undefined : currency,
    }),
    [committedSearch, status, currency]
  );

  const { data, isLoading, isError, error } = useWalletsList(
    filters,
    page,
    WALLETS_PAGE_LIMIT
  );

  // The currency filter is built from what the summary actually reports, so a
  // new currency on the backend appears here without a frontend change.
  const currencyOptions = data?.summary.byCurrency.map(
    (entry) => entry.currency
  );

  function handleStatusSelect(next: StatusFilter) {
    setStatus(next);
    setPage(1);
  }

  const columns: DataTableColumn<WalletAccount>[] = [
    {
      header: "Owner",
      cell: (wallet) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="size-8">
            <AvatarFallback>{initials(wallet.userName)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">
              {wallet.userName || "Unnamed user"}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {wallet.id.slice(0, 8)}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Balance",
      cell: (wallet) => (
        <span className="font-medium tabular-nums">
          {formatMoney(wallet.balance, wallet.currency)}
        </span>
      ),
    },
    { header: "Currency", cell: (wallet) => wallet.currency },
    {
      header: "Status",
      cell: (wallet) => <WalletAccountStatusBadge status={wallet.status} />,
    },
    {
      header: "Virtual Account",
      cell: (wallet) => (
        <VirtualAccount
          account={wallet.virtualAccount}
          className="flex flex-col"
        />
      ),
    },
    {
      header: "Provider",
      cell: (wallet) =>
        wallet.provider ? (
          <Badge variant="outline">{humanizeToken(wallet.provider)}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  const isForbidden =
    isError && error instanceof WalletApiError && error.status === 403;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Wallets
        </h1>
        <p className="text-sm text-muted-foreground">
          Every wallet on the platform, with balances and the virtual accounts
          they fund from.
        </p>
      </div>

      {!isError && (
        <WalletsSummaryCards
          summary={data?.summary}
          isLoading={isLoading}
          activeStatus={status}
          onStatusSelect={handleStatusSelect}
        />
      )}

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <CardTitle className="font-heading text-base">Wallets</CardTitle>
          {data && <Badge variant="secondary">{data.pagination.total}</Badge>}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-56 flex-1">
              <InputGroup>
                <InputGroupAddon>
                  <Search className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Search by wallet owner's name"
                  value={rawSearch}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      if (debounceTimerRef.current) {
                        clearTimeout(debounceTimerRef.current);
                      }
                      commitSearch(rawSearch);
                    }
                  }}
                />
              </InputGroup>
            </div>

            <Select
              value={status}
              onValueChange={(value: StatusFilter | null) =>
                handleStatusSelect(value ?? "all")
              }
            >
              <SelectTrigger size="sm">
                <SelectValue>
                  {status === "all"
                    ? "Status"
                    : WALLET_ACCOUNT_STATUS_LABEL[status]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {WALLET_ACCOUNT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {currencyOptions && currencyOptions.length > 1 && (
              <Select
                value={currency}
                onValueChange={(value: CurrencyFilter | null) => {
                  setCurrency(value ?? "all");
                  setPage(1);
                }}
              >
                <SelectTrigger size="sm">
                  <SelectValue>
                    {currency === "all" ? "Currency" : currency}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All currencies</SelectItem>
                  {currencyOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

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
          ) : isForbidden ? (
            <p className="text-sm text-muted-foreground">
              {(error as WalletApiError).message ||
                "You do not have permission to view wallets."}
            </p>
          ) : isError ? (
            <p className="text-sm text-muted-foreground">
              Something went wrong loading wallets. Please try again.
            </p>
          ) : (
            <>
              <DataTable
                columns={columns}
                data={data?.wallets ?? []}
                getRowId={(wallet) => wallet.id}
                emptyMessage="No wallets match these filters."
                onRowClick={(wallet) =>
                  wallet.userId && router.push(`/users/${wallet.userId}`)
                }
              />
              <PaginationControls
                page={data?.pagination.page ?? page}
                pageCount={data?.pagination.totalPages ?? 1}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
