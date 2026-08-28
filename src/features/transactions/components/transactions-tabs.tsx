"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleGate } from "@/components/shared/role-gate";
import { PendingTransfersTab } from "@/features/pending-transfers/components/pending-transfers-tab";
import { AllTransactionsView } from "@/features/transactions/components/all-transactions-view";
import { OverdueAlertBanner } from "@/features/transactions/components/overdue-alert-banner";
import { ReconciliationView } from "@/features/reconciliation/components/reconciliation-view";
import { RECONCILIATION_ROLES } from "@/features/reconciliation/constants";

export function TransactionsTabs() {
  const [tab, setTab] = useState("all");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        Transactions
      </h1>

      <OverdueAlertBanner onJumpToPendingTransfers={() => setTab("pending")} />

      <Tabs value={tab} onValueChange={setTab} className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="pending">Pending Transfers</TabsTrigger>
          {/* Stricter gate than the other two tabs: reconciliation is a
              financial-integrity function, not general transaction browsing. */}
          <RoleGate allow={[...RECONCILIATION_ROLES]}>
            <TabsTrigger value="reconciliation">
              Anchor Reconciliation
            </TabsTrigger>
          </RoleGate>
        </TabsList>
        <TabsContent value="all">
          <AllTransactionsView />
        </TabsContent>
        <TabsContent value="pending">
          <PendingTransfersTab />
        </TabsContent>
        <TabsContent value="reconciliation">
          <RoleGate
            allow={[...RECONCILIATION_ROLES]}
            fallback={
              <p className="text-sm text-muted-foreground">
                You don&apos;t have access to Anchor reconciliation. This
                function is limited to Compliance and Super Admin.
              </p>
            }
          >
            <ReconciliationView />
          </RoleGate>
        </TabsContent>
      </Tabs>
    </div>
  );
}
