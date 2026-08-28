"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { PaginationControls } from "@/components/shared/pagination-controls";
import {
  hasActiveFilters,
  useTransferSearch,
} from "@/features/pending-transfers/api";
import { SEARCH_PAGE_LIMIT } from "@/features/pending-transfers/constants";
import { TransfersTable } from "@/features/pending-transfers/components/transfers-table";
import type { TransferSearchFilters } from "@/features/pending-transfers/types";

export function SearchView() {
  const [userQuery, setUserQuery] = useState("");
  const [reference, setReference] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [debounced, setDebounced] = useState<TransferSearchFilters>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebounced({
        user: userQuery.trim() || undefined,
        reference: reference.trim() || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setPage(1);
    }, 400);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [userQuery, reference, dateFrom, dateTo]);

  const filters = debounced;
  const isSearching = hasActiveFilters(filters);
  const { data, isFetching, isError } = useTransferSearch(
    filters,
    page,
    SEARCH_PAGE_LIMIT
  );

  const pageCount = useMemo(
    () => (data ? Math.max(1, Math.ceil(data.total / SEARCH_PAGE_LIMIT)) : 1),
    [data]
  );

  function clearAll() {
    setUserQuery("");
    setReference("");
    setDateFrom("");
    setDateTo("");
  }

  const anyInput = userQuery.trim() || reference.trim() || dateFrom || dateTo;

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <CardTitle className="text-base">Search transfers</CardTitle>
        {data && isSearching && <Badge variant="secondary">{data.total}</Badge>}
        {anyInput && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7"
            onClick={clearAll}
          >
            <X className="size-3.5" /> Clear
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <Label htmlFor="pt-user">User</Label>
            <InputGroup>
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                id="pt-user"
                placeholder="Name, username, or phone"
                value={userQuery}
                onChange={(event) => setUserQuery(event.target.value)}
              />
            </InputGroup>
          </div>
          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <Label htmlFor="pt-ref">Transaction reference</Label>
            <Input
              id="pt-ref"
              placeholder="e.g. TRF-8F2A19"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pt-from">Created from</Label>
            <Input
              id="pt-from"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pt-to">Created to</Label>
            <Input
              id="pt-to"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
        </div>

        {!isSearching ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Search by user, date range, or an exact transaction reference to
            look up transfers in the pending accept/decline system.
          </p>
        ) : isFetching && !data ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isError ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Something went wrong running that search. Please try again.
          </p>
        ) : (
          <>
            <TransfersTable
              transfers={data?.transfers ?? []}
              variant="results"
              emptyMessage="No transfers match this search."
            />
            <PaginationControls
              page={page}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
