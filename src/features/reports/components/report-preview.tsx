import { ChevronLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { downloadCsv } from "@/lib/csv";
import { formatDate } from "@/lib/format";
import { TRANSACTION_TYPE_LABEL } from "@/features/wallet/constants";
import { getReportType } from "@/features/reports/report-types";
import {
  ACCOUNT_TYPE_LABELS,
  ADMIN_ACTIVITY_TYPE_LABELS,
  type GeneratedReport,
} from "@/features/reports/types";

export function ReportPreview({
  report,
  onBack,
  backLabel,
}: {
  report: GeneratedReport;
  onBack: () => void;
  backLabel: string;
}) {
  const type = getReportType(report.typeId);
  const { from, to } = report.params.range;
  const { accountType, transactionType, adminActivityType } = report.params;
  const filterLabel =
    accountType && accountType !== "all"
      ? ACCOUNT_TYPE_LABELS[accountType]
      : transactionType && transactionType !== "all"
        ? TRANSACTION_TYPE_LABEL[transactionType]
        : adminActivityType && adminActivityType !== "all"
          ? ADMIN_ACTIVITY_TYPE_LABELS[adminActivityType]
          : null;

  function handleDownload() {
    const csv = type.buildCsv?.(report);
    if (!csv) {
      // Report types still on placeholder content have no real export yet.
      console.log("[reports] download not available for", report.typeId);
      return;
    }
    downloadCsv(csv.filename, csv.rows);
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="-ml-2 w-fit text-muted-foreground"
      >
        <ChevronLeft className="size-4" />
        {backLabel}
      </Button>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">{type.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Generated on {formatDate(report.generatedAt)} for{" "}
              {formatDate(`${from}T00:00:00`)} – {formatDate(`${to}T00:00:00`)}
              {filterLabel ? ` · ${filterLabel}` : ""}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="size-4" />
            Download
          </Button>
        </CardHeader>
        <CardContent>
          {/* Report-type-specific body, from the `renderPreview` hook on this
              report type's REPORT_TYPES entry. */}
          {type.renderPreview(report)}
        </CardContent>
      </Card>
    </div>
  );
}
