"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverdueView } from "@/features/pending-transfers/components/overdue-view";
import { SearchView } from "@/features/pending-transfers/components/search-view";

/**
 * The Pending Transfers tab: the Overdue and Search/Lookup views for the
 * pending accept/decline system, unchanged. Rendered inside the outer
 * Transactions tab structure.
 */
export function PendingTransfersTab() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Investigate transfers in the pending accept/decline system — free-will
        sends and mismatched request fulfillments that a recipient has 24 hours
        to Accept or Decline before an automatic refund fires.
      </p>

      <Tabs defaultValue="overdue" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="overdue">Overdue pending</TabsTrigger>
          <TabsTrigger value="search">Search / lookup</TabsTrigger>
        </TabsList>
        <TabsContent value="overdue">
          <OverdueView />
        </TabsContent>
        <TabsContent value="search">
          <SearchView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
