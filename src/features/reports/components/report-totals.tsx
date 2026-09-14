import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StatusTone } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import { ReportStatCard } from "@/features/reports/components/report-stat-card";
import type {
  ReportBreakdown,
  ReportTotalsView,
} from "@/features/reports/presentation";

/** Semantic values (verified, failed…) keep their status colour. */
const TONE_SWATCH: Record<StatusTone, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  blue: "bg-sky-500",
  slate: "bg-slate-400",
  gray: "bg-muted-foreground/40",
};

/** Everything else (account types, actions) cycles a neutral palette. */
const CATEGORICAL_SWATCHES = [
  "bg-sky-500",
  "bg-violet-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-lime-500",
];

const percentFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

function BreakdownCard({ breakdown }: { breakdown: ReportBreakdown }) {
  const swatches = breakdown.items.map((item, index) =>
    item.tone
      ? TONE_SWATCH[item.tone]
      : CATEGORICAL_SWATCHES[index % CATEGORICAL_SWATCHES.length]
  );
  const showBar = breakdown.total !== null && breakdown.total > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between gap-2 text-sm font-medium text-muted-foreground">
          <span>By {breakdown.label.toLowerCase()}</span>
          {breakdown.total !== null && (
            <span className="text-xs tabular-nums">
              {breakdown.total.toLocaleString()} total
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {showBar && (
          <div
            className="flex h-2 w-full gap-px overflow-hidden rounded-full bg-muted"
            aria-hidden
          >
            {breakdown.items.map((item, index) =>
              item.percent ? (
                <div
                  key={item.key}
                  className={swatches[index]}
                  style={{ width: `${item.percent}%` }}
                />
              ) : null
            )}
          </div>
        )}
        <ul className="flex flex-col gap-1.5">
          {breakdown.items.map((item, index) => (
            <li
              key={item.key}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    swatches[index]
                  )}
                  aria-hidden
                />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                <span className="font-medium">{item.value}</span>
                {item.percent !== null && (
                  <span className="w-12 text-right text-xs text-muted-foreground">
                    {percentFormat.format(item.percent)}%
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/**
 * The totals block: headline figures as stat cards, grouped counts as
 * breakdown cards (signups by verification outcome, by account type…).
 */
export function ReportTotals({ totals }: { totals: ReportTotalsView }) {
  if (totals.stats.length === 0 && totals.breakdowns.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {totals.stats.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {totals.stats.map((stat) => (
            <ReportStatCard
              key={stat.key}
              title={stat.label}
              value={stat.value}
            />
          ))}
        </div>
      )}
      {totals.breakdowns.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {totals.breakdowns.map((breakdown) => (
            <BreakdownCard key={breakdown.key} breakdown={breakdown} />
          ))}
        </div>
      )}
    </div>
  );
}
