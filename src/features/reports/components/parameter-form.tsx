import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangeFields } from "@/features/reports/components/date-range-fields";
import { getReportType } from "@/features/reports/report-types";
import type { ReportParams, ReportTypeId } from "@/features/reports/types";

export function ParameterForm({
  typeId,
  params,
  onParamsChange,
  onBack,
  onGenerate,
  isGenerating,
}: {
  typeId: ReportTypeId;
  params: ReportParams;
  onParamsChange: (params: ReportParams) => void;
  onBack: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}) {
  const type = getReportType(typeId);
  const { from, to } = params.range;
  const canGenerate = Boolean(from && to) && from <= to;

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="-ml-2 w-fit text-muted-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to report types
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{type.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {/* Required for every report type. */}
          <DateRangeFields
            value={params.range}
            onChange={(range) => onParamsChange({ ...params, range })}
          />

          {/* ================================================================
              EXTENSION POINT — report-specific filters.
              Each report type supplies its own filters via `renderFilters` on
              its REPORT_TYPES entry; they render here and merge their values
              into `ReportParams`. Report types without extra filters render
              nothing here.
              ================================================================ */}
          {type.renderFilters?.({ params, onChange: onParamsChange })}

          <div>
            <Button
              onClick={onGenerate}
              disabled={!canGenerate || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating report…
                </>
              ) : (
                "Generate Report"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
