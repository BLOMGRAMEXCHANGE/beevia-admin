import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletAccountStatusBadge } from "@/features/wallet/components/wallet-account-status-badge";
import { WALLET_ACCOUNT_STATUS_LABEL } from "@/features/wallet/constants";
import { cn } from "@/lib/utils";
import { formatMoney, humanizeToken } from "@/lib/format";
import type {
  WalletAccountStatus,
  WalletsSummary,
} from "@/features/wallet/types";

const countFormat = new Intl.NumberFormat("en-US");

function SummaryCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-0.5">
        <p className="font-heading text-3xl font-bold tracking-tight tabular-nums">
          {value}
        </p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function WalletsSummaryCards({
  summary,
  isLoading,
  activeStatus,
  onStatusSelect,
}: {
  summary: WalletsSummary | undefined;
  isLoading: boolean;
  activeStatus: WalletAccountStatus | "all";
  onStatusSelect: (status: WalletAccountStatus | "all") => void;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (!summary) return null;

  const statusEntries = Object.entries(summary.byStatus).filter(
    ([, count]) => count > 0
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          title="Total wallets"
          value={countFormat.format(summary.totalWallets)}
        />
        {/* One card per currency rather than a single total: balances in
            different currencies can't be summed into a meaningful figure. */}
        {summary.byCurrency.map((entry) => (
          <SummaryCard
            key={entry.currency}
            title={`${entry.currency} balance`}
            value={formatMoney(entry.totalBalance, entry.currency)}
            hint={`Across ${countFormat.format(entry.wallets)} ${
              entry.wallets === 1 ? "wallet" : "wallets"
            }`}
          />
        ))}
      </div>

      {statusEntries.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">By status:</span>
          {statusEntries.map(([status, count]) => {
            const isActive = activeStatus === status;
            return (
              <button
                key={status}
                type="button"
                aria-pressed={isActive}
                onClick={() =>
                  onStatusSelect(
                    isActive ? "all" : (status as WalletAccountStatus)
                  )
                }
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2 py-1 text-sm transition-colors hover:bg-muted",
                  isActive ? "border-primary bg-muted" : "border-transparent"
                )}
              >
                {status in WALLET_ACCOUNT_STATUS_LABEL ? (
                  <WalletAccountStatusBadge
                    status={status as WalletAccountStatus}
                  />
                ) : (
                  <span>{humanizeToken(status)}</span>
                )}
                <span className="font-medium tabular-nums">
                  {countFormat.format(count)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
