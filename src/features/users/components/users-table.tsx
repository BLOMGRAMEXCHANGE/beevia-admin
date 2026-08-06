"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Download, MoreHorizontal, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { AccountStatusBadge } from "@/features/users/components/account-status-badge";
import { VerificationBadge } from "@/features/users/components/verification-badge";
import { WalletStatusBadge } from "@/features/users/components/wallet-status-badge";
import { ACCOUNT_TYPE_LABEL } from "@/features/users/account-type";
import { useUsers } from "@/features/users/api";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import type {
  AccountType,
  AppUser,
  UserAccountStatus,
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
  { value: "pending", label: "Pending" },
];

const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "this_month", label: "This month" },
] as const;

type DateRange = (typeof DATE_RANGE_OPTIONS)[number]["value"];

function labelFor<T extends string>(
  options: { value: T; label: string }[],
  value: T
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

const PAGE_SIZE = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

function matchesDateRange(createdAt: string, range: DateRange): boolean {
  if (range === "all") return true;
  const joined = new Date(createdAt);
  const now = new Date();

  if (range === "7d") return now.getTime() - joined.getTime() <= 7 * DAY_MS;
  if (range === "30d") return now.getTime() - joined.getTime() <= 30 * DAY_MS;
  // this_month
  return (
    joined.getFullYear() === now.getFullYear() &&
    joined.getMonth() === now.getMonth()
  );
}

export function UsersTable() {
  const { data: users, isLoading } = useUsers();

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState<FilterValue<string>>("all");
  const [accountType, setAccountType] =
    useState<FilterValue<AccountType>>("all");
  const [status, setStatus] = useState<FilterValue<UserAccountStatus>>("all");
  const [verification, setVerification] =
    useState<FilterValue<VerificationStatus>>("all");
  const [walletStatus, setWalletStatus] =
    useState<FilterValue<WalletStatus>>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [page, setPage] = useState(1);

  const countries = useMemo(
    () => Array.from(new Set((users ?? []).map((user) => user.country))).sort(),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (users ?? []).filter((user) => {
      if (query) {
        const haystack =
          `${user.fullName} ${user.username} ${user.email ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (country !== "all" && user.country !== country) return false;
      if (accountType !== "all" && user.accountType !== accountType)
        return false;
      if (status !== "all" && user.status !== status) return false;
      if (verification !== "all" && user.verification !== verification)
        return false;
      if (walletStatus !== "all" && user.walletStatus !== walletStatus)
        return false;
      if (!matchesDateRange(user.createdAt, dateRange)) return false;
      return true;
    });
  }, [
    users,
    search,
    country,
    accountType,
    status,
    verification,
    walletStatus,
    dateRange,
  ]);

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedUsers = filteredUsers.slice(pageStart, pageStart + PAGE_SIZE);

  function updateFilter<T extends string>(
    setter: (value: T) => void,
    fallback: T
  ) {
    return (value: T | null) => {
      setter(value ?? fallback);
      setPage(1);
    };
  }

  function handleExport() {
    downloadCsv(
      "beevia-users.csv",
      filteredUsers.map((user) => ({
        userCode: user.userCode,
        fullName: user.fullName,
        username: user.username,
        email: user.email ?? "",
        phone: user.phone,
        country: user.country,
        accountType: ACCOUNT_TYPE_LABEL[user.accountType],
        verification: user.verification,
        walletStatus: user.walletStatus,
        status: user.status,
        joined: formatDate(user.createdAt),
      }))
    );
  }

  const columns: DataTableColumn<AppUser>[] = [
    {
      header: "Name & Username",
      cell: (user) => (
        <Link
          href={`/users/${user.id}`}
          className="flex items-center gap-2.5 hover:underline"
        >
          <Avatar className="size-8">
            <AvatarFallback className={`${user.avatarColor} text-white`}>
              {user.fullName
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{user.fullName}</span>
            <span className="text-xs text-muted-foreground">
              {user.username}
            </span>
          </div>
        </Link>
      ),
    },
    { header: "User ID", cell: (user) => user.userCode },
    {
      header: "Contact",
      cell: (user) => (
        <div className="flex flex-col">
          <span>{user.email ?? "Not provided"}</span>
          <span className="text-xs text-muted-foreground">{user.phone}</span>
        </div>
      ),
    },
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
      cell: (user) => <WalletStatusBadge status={user.walletStatus} />,
    },
    {
      header: "Account Status",
      cell: (user) => <AccountStatusBadge status={user.status} />,
    },
    { header: "Joined", cell: (user) => formatDate(user.createdAt) },
    {
      header: "Last Active",
      cell: (user) => formatRelativeTime(user.lastActiveAt),
    },
    {
      header: "Action",
      className: "text-right",
      cell: (user) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Actions</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem render={<Link href={`/users/${user.id}`} />}>
              View account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Users
        </h1>
        <Button onClick={handleExport} disabled={filteredUsers.length === 0}>
          <Download data-icon="inline-start" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <CardTitle className="font-heading text-base">Users</CardTitle>
          <Badge variant="secondary">
            {(users ?? []).length.toLocaleString()}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-56 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, username…"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="pl-8"
              />
            </div>

            <Select
              value={country}
              onValueChange={updateFilter<FilterValue<string>>(
                setCountry,
                "all"
              )}
            >
              <SelectTrigger size="sm">
                <SelectValue>
                  {country === "all" ? "Country" : country}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {countries.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={accountType}
              onValueChange={updateFilter<FilterValue<AccountType>>(
                setAccountType,
                "all"
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
              value={status}
              onValueChange={updateFilter<FilterValue<UserAccountStatus>>(
                setStatus,
                "all"
              )}
            >
              <SelectTrigger size="sm">
                <SelectValue>
                  {status === "all"
                    ? "Account Status"
                    : labelFor(ACCOUNT_STATUS_OPTIONS, status)}
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
                setVerification,
                "all"
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
              value={walletStatus}
              onValueChange={updateFilter<FilterValue<WalletStatus>>(
                setWalletStatus,
                "all"
              )}
            >
              <SelectTrigger size="sm">
                <SelectValue>
                  {walletStatus === "all"
                    ? "Wallet Status"
                    : labelFor(WALLET_OPTIONS, walletStatus)}
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

            <Select
              value={dateRange}
              onValueChange={updateFilter<DateRange>(setDateRange, "all")}
            >
              <SelectTrigger size="sm">
                <CalendarDays data-icon="inline-start" className="size-4" />
                <SelectValue>
                  {
                    DATE_RANGE_OPTIONS.find(
                      (option) => option.value === dateRange
                    )?.label
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={pagedUsers}
              getRowId={(user) => user.id}
              emptyMessage="No users match these filters."
            />
          )}

          <PaginationControls
            page={currentPage}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
