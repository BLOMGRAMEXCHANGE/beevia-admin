import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DateRangeFields } from "@/features/reports/components/date-range-fields";
import { ReportFilterFields } from "@/features/reports/components/report-filter-fields";
import type { ReportParams, ReportType } from "@/features/reports/types";

export function ParameterForm({
  type,
  params,
  onParamsChange,
  onBack,
  onGenerate,
  isGenerating,
}: {
  type: ReportType;
  params: ReportParams;
  onParamsChange: (params: ReportParams) => void;
  onBack: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}) {
  const { from, to } = params.range;
  const rangeInvalid = Boolean(from && to) && from > to;
  const canGenerate = Boolean(from && to) && !rangeInvalid;

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
          <CardTitle className="text-base">{type.label}</CardTitle>
          {type.description && (
            <CardDescription className="max-w-3xl">
              {type.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (canGenerate && !isGenerating) onGenerate();
            }}
          >
            <fieldset className="flex flex-col gap-2" disabled={isGenerating}>
              <legend className="mb-2 text-sm font-medium">Date range</legend>
              <DateRangeFields
                value={params.range}
                onChange={(range) => onParamsChange({ ...params, range })}
              />
              {rangeInvalid && (
                <p className="text-xs text-destructive">
                  The start date must be on or before the end date.
                </p>
              )}
            </fieldset>

            {type.filters.length > 0 && (
              <fieldset className="flex flex-col" disabled={isGenerating}>
                <legend className="mb-2 text-sm font-medium">Filters</legend>
                <ReportFilterFields
                  filters={type.filters}
                  params={params}
                  onChange={onParamsChange}
                />
              </fieldset>
            )}

            <div>
              <Button type="submit" disabled={!canGenerate || isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Queuing report…
                  </>
                ) : (
                  "Generate report"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
