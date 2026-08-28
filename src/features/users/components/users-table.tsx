"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { AccountStatusBadge } from "@/features/users/components/account-status-badge";
import { VerificationBadge } from "@/features/users/components/verification-badge";
import { WalletStatusBadge } from "@/features/users/components/wallet-status-badge";
import { SearchField } from "@/features/users/components/search-field";
import { ACCOUNT_TYPE_LABEL } from "@/features/users/account-type";
import { COUNTRIES, countryName } from "@/features/users/countries";
import {
  UserApiError,
  useExportUsers,
  useRecordSearch,
  useUsersList,
  type UsersFilters,
} from "@/features/users/api";
import { formatDate, formatRelativeTime } from "@/lib/format";
import type {
  AccountType,
  UserAccountStatus,
  UserRecord,
  VerificationStatus,
  WalletStatus,
} from "@/types/user";

type FilterValue<T extends string> = T | "all";

const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: "chat_only", label: "Chat Only" },
  { value: "chat_banking", label: "Chat + Banking" },
];

const ACCOUNT_STATUS_OPTIONS: { value: UserAccountStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "restricted", label: "Restricted" },
  { value: "suspended", label: "Suspended" },
  { value: "deactivated", label: "Deactivated" },
  { value: "deleting", label: "Deleting" },
  { value: "deleted", label: "Deleted" },
];

const VERIFICATION_OPTIONS: { value: VerificationStatus; label: string }[] = [
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
];

const WALLET_OPTIONS: { value: WalletStatus; label: string }[] = [
  { value: "none", label: "None" },
  { value: "active", label: "Active" },
  { value: "frozen", label: "Frozen" },
  { value: "closed", label: "Closed" },
];

function labelFor<T extends string>(
  options: { value: T; label: string }[],
  value: T
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

function initials(fullName: string | null | undefined): string {
  if (!fullName) return "?";
  return fullName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const PAGE_LIMIT = 20;

export function UsersTable() {
  const router = useRouter();

  const [rawSearch, setRawSearch] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [country, setCountry] = useState<FilterValue<string>>("all");
  const [accountType, setAccountType] =
    useState<FilterValue<AccountType>>("all");
  const [accountStatus, setAccountStatus] =
    useState<FilterValue<UserAccountStatus>>("all");
  const [verification, setVerification] =
    useState<FilterValue<VerificationStatus>>("all");
  const [wallet, setWallet] = useState<FilterValue<WalletStatus>>("all");
  const [joinedFrom, setJoinedFrom] = useState("");
  const [joinedTo, setJoinedTo] = useState("");
  const [page, setPage] = useState(1);

  const { mutate: recordSearch } = useRecordSearch();
  const lastRecordedTermRef = useRef("");

  function commitSearch(term: string) {
    const trimmed = term.trim();
    setCommittedSearch(trimmed);
    setPage(1);
    if (trimmed && trimmed !== lastRecordedTermRef.current) {
      lastRecordedTermRef.current = trimmed;
      recordSearch(trimmed);
    }
  }

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function handleSearchCommit(term: string) {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    commitSearch(term);
  }

  function updateFilter<T extends string>(setter: (value: T) => void) {
    return (value: T | null) => {
      setter((value ?? "all") as T);
      setPage(1);
    };
  }

  function setThisMonthPreset() {
    const now = new Date();
    setJoinedFrom(
      toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1))
    );
    setJoinedTo(
      toDateInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0))
    );
    setPage(1);
  }

  const hasActiveFilters =
    Boolean(committedSearch) ||
    country !== "all" ||
    accountType !== "all" ||
    accountStatus !== "all" ||
    verification !== "all" ||
    wallet !== "all" ||
    Boolean(joinedFrom) ||
    Boolean(joinedTo);

  function clearFilters() {
    setRawSearch("");
    setCommittedSearch("");
    setCountry("all");
    setAccountType("all");
    setAccountStatus("all");
    setVerification("all");
    setWallet("all");
    setJoinedFrom("");
    setJoinedTo("");
    setPage(1);
  }

  const filters: UsersFilters = useMemo(
    () => ({
      search: committedSearch || undefined,
      country: country === "all" ? undefined : country,
      accountType: accountType === "all" ? undefined : accountType,
      accountStatus: accountStatus === "all" ? undefined : accountStatus,
      verification: verification === "all" ? undefined : verification,
      wallet: wallet === "all" ? undefined : wallet,
      joinedFrom: joinedFrom || undefined,
      joinedTo: joinedTo || undefined,
    }),
    [
      committedSearch,
      country,
      accountType,
      accountStatus,
      verification,
      wallet,
      joinedFrom,
      joinedTo,
    ]
  );

  const { data, isLoading, isError, error } = useUsersList(
    filters,
    page,
    PAGE_LIMIT
  );
  const { mutate: exportUsers, isPending: isExporting } = useExportUsers();

  function handleExport() {
    exportUsers(filters, {
      onError: (mutationError) => {
        toast.error(
          mutationError instanceof UserApiError
            ? mutationError.message
            : "Something went wrong exporting users. Please try again."
        );
      },
    });
  }

  const columns: DataTableColumn<UserRecord>[] = [
    {
      header: "Name & Username",
      cell: (user) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="size-8">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback>{initials(user.fullName)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">
              {user.fullName || "Unnamed user"}
            </span>
            <span className="text-xs text-muted-foreground">
              {user.username}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Contact",
      cell: (user) => (
        <div className="flex flex-col">
          <span>{user.email ?? "Not provided"}</span>
          <span className="text-xs text-muted-foreground">{user.phone}</span>
        </div>
      ),
    },
    { header: "Country", cell: (user) => countryName(user.country) },
    {
      header: "Account Type",
      cell: (user) => ACCOUNT_TYPE_LABEL[user.accountType],
    },
    {
      header: "Verification",
      cell: (user) => <VerificationBadge status={user.verification} />,
    },
    {
      header: "Wallet",
      cell: (user) => <WalletStatusBadge status={user.wallet} />,
    },
    {
      header: "Account Status",
      cell: (user) => <AccountStatusBadge status={user.status} />,
    },
    { header: "Joined", cell: (user) => formatDate(user.joinedAt) },
    {
      header: "Last Active",
      cell: (user) =>
        user.lastActiveAt ? formatRelativeTime(user.lastActiveAt) : "Never",
    },
  ];

  const isForbidden =
    isError && error instanceof UserApiError && error.status === 403;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Users
        </h1>
        <Button onClick={handleExport} disabled={isExporting}>
          <Download data-icon="inline-start" />
          {isExporting ? "Exporting…" : "Export"}
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <CardTitle className="font-heading text-base">Users</CardTitle>
          {data && <Badge variant="secondary">{data.pagination.total}</Badge>}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <SearchField
              value={rawSearch}
              onChange={handleSearchChange}
              onCommit={handleSearchCommit}
            />

            <Select
              value={country}
              onValueChange={updateFilter<FilterValue<string>>(setCountry)}
            >
              <SelectTrigger size="sm">
                <SelectValue>
                  {country === "all" ? "Country" : countryName(country)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {COUNTRIES.map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={accountType}
              onValueChange={updateFilter<FilterValue<AccountType>>(
                setAccountType
              )}
            >
              <SelectTrigger size="sm">
                <SelectValue>
                  {accountType === "all"
                    ? "Account Type"
                    : ACCOUNT_TYPE_LABEL[accountType]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All account types</SelectItem>
                {ACCOUNT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={accountStatus}
              onValueChange={updateFilter<FilterValue<UserAccountStatus>>(
                setAccountStatus
              )}
            >
              <SelectTrigger size="sm">
                <SelectValue>
                  {accountStatus === "all"
                    ? "Account Status"
                    : labelFor(ACCOUNT_STATUS_OPTIONS, accountStatus)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {ACCOUNT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={verification}
              onValueChange={updateFilter<FilterValue<VerificationStatus>>(
                setVerification
              )}
            >
              <SelectTrigger size="sm">
                <SelectValue>
                  {verification === "all"
                    ? "Verification"
                    : labelFor(VERIFICATION_OPTIONS, verification)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All verification</SelectItem>
                {VERIFICATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={wallet}
              onValueChange={updateFilter<FilterValue<WalletStatus>>(setWallet)}
            >
              <SelectTrigger size="sm">
                <SelectValue>
                  {wallet === "all"
                    ? "Wallet"
                    : labelFor(WALLET_OPTIONS, wallet)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All wallet status</SelectItem>
                {WALLET_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                aria-label="Joined from"
                value={joinedFrom}
                onChange={(event) => {
                  setJoinedFrom(event.target.value);
                  setPage(1);
                }}
                className="w-36"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="date"
                aria-label="Joined to"
                value={joinedTo}
                onChange={(event) => {
                  setJoinedTo(event.target.value);
                  setPage(1);
                }}
                className="w-36"
              />
              <Button variant="outline" size="sm" onClick={setThisMonthPreset}>
                <CalendarDays data-icon="inline-start" className="size-4" />
                This month
              </Button>
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
          ) : isForbidden ? (
            <p className="text-sm text-muted-foreground">
              {(error as UserApiError).message ||
                "You do not have permission to view users."}
            </p>
          ) : isError ? (
            <p className="text-sm text-muted-foreground">
              Something went wrong loading users. Please try again.
            </p>
          ) : (
            <>
              <DataTable
                columns={columns}
                data={data?.users ?? []}
                getRowId={(user) => user.id}
                emptyMessage="No users match these filters."
                onRowClick={(user) => router.push(`/users/${user.id}`)}
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
