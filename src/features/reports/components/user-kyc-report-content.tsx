import { buildUserKycStats } from "@/features/reports/mock-data";
import { ReportStatCard } from "@/features/reports/components/report-stat-card";
import {
  ACCOUNT_TYPE_LABELS,
  type ReportParams,
} from "@/features/reports/types";

const numberFormat = new Intl.NumberFormat("en-US");
const fmt = (value: number) => numberFormat.format(value);

/**
 * User & KYC report body — an aggregate/point-in-time snapshot for the selected
 * period and account-type segment. Intentionally NOT a per-user list: the Users
 * page already handles per-user browsing.
 */
export function UserKycReportContent({ params }: { params: ReportParams }) {
  const stats = buildUserKycStats(params);
  const isSegmented = stats.accountType !== "all";

  return (
    <div className="flex flex-col gap-6">
      {/* Header stats row. verified + pending + failed === total new signups. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportStatCard
          title="Total New Signups"
          value={fmt(stats.totalSignups)}
        />
        <ReportStatCard title="Verified" value={fmt(stats.verified)} />
        <ReportStatCard title="Pending" value={fmt(stats.pending)} />
        <ReportStatCard title="Failed" value={fmt(stats.failed)} />
      </div>

      {isSegmented ? (
        // Account Type filter is set to a specific segment, so a split-by-type
        // breakdown would just restate the total above — show a one-line note
        // instead of the redundant comparison.
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium">
            {ACCOUNT_TYPE_LABELS[stats.accountType]}
          </span>{" "}
          accounts only. Switch the Account Type filter to “All” to see the Chat
          Only vs Chat + Banking breakdown.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">Account Type Breakdown</h3>
          <p className="text-xs text-muted-foreground">
            New signups for the period, split by account type.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <ReportStatCard
              title="Chat Only"
              value={fmt(stats.breakdown.chatOnly)}
            />
            <ReportStatCard
              title="Chat + Banking"
              value={fmt(stats.breakdown.chatBanking)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
