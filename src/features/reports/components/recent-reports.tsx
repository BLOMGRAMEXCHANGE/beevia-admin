import { FileClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { getReportType } from "@/features/reports/report-types";
import type { RecentReport } from "@/features/reports/types";

export function RecentReports({
  reports,
  isLoading,
  onReopen,
}: {
  reports: RecentReport[] | undefined;
  isLoading: boolean;
  onReopen: (report: RecentReport) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Reports</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : !reports || reports.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <FileClock className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">No reports generated yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Pick a report type above and generate one — it&apos;ll show up
              here for quick access.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y">
            {reports.map((report) => {
              const type = getReportType(report.typeId);
              const { from, to } = report.params.range;
              return (
                <li
                  key={report.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium">{type.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(`${from}T00:00:00`)} –{" "}
                      {formatDate(`${to}T00:00:00`)} · generated{" "}
                      {formatRelativeTime(report.generatedAt)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReopen(report)}
                  >
                    Reopen
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
