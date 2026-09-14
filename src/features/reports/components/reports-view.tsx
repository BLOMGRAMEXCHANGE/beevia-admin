"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ReportTypeGallery } from "@/features/reports/components/report-type-gallery";
import { ParameterForm } from "@/features/reports/components/parameter-form";
import { ReportPreview } from "@/features/reports/components/report-preview";
import { RecentReports } from "@/features/reports/components/recent-reports";
import {
  ReportsApiError,
  useGenerateReport,
  useRecentReports,
  useReportTypes,
  type GenerateReportInput,
} from "@/features/reports/api";
import { useReportDownload } from "@/features/reports/use-report-download";
import type {
  DateRange,
  Report,
  ReportListFilters,
  ReportParams,
  ReportTypeId,
} from "@/features/reports/types";

type View =
  | { step: "gallery" }
  | { step: "form"; typeId: ReportTypeId }
  | {
      step: "report";
      reportId: string;
      typeId: ReportTypeId;
      from: "form" | "list";
    };

function toDateInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Month to date — the window most reports are pulled for. */
function defaultRange(): DateRange {
  const now = new Date();
  return {
    from: toDateInput(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toDateInput(now),
  };
}

/** A settled report's inputs, back in form shape — for "Generate again". */
function paramsFromReport(report: Report): ReportParams {
  return {
    range: {
      from: report.dateFrom.slice(0, 10),
      to: report.dateTo.slice(0, 10),
    },
    filters: { ...report.filters },
  };
}

export function ReportsView() {
  const [view, setView] = useState<View>({ step: "gallery" });
  const [params, setParams] = useState<ReportParams>(() => ({
    range: defaultRange(),
    filters: {},
  }));

  // Lives here, not in the list, so it survives opening a report and coming
  // back — the admin returns to the same tab, filters and page.
  const [listFilters, setListFilters] = useState<ReportListFilters>({
    type: "",
    status: "",
    mine: true,
  });
  const [listPage, setListPage] = useState(1);

  const reportTypes = useReportTypes();
  const generate = useGenerateReport();
  const { download, downloadingId } = useReportDownload();

  const findType = (typeId: ReportTypeId) =>
    reportTypes.data?.find((type) => type.id === typeId);
  const formType = view.step === "form" ? findType(view.typeId) : undefined;
  const showGallery =
    view.step === "gallery" || (view.step === "form" && !formType);

  // Paused while off-screen; refetches on return, so it's never stale.
  const recentReports = useRecentReports(listFilters, listPage, {
    enabled: showGallery,
  });

  function openForm(typeId: ReportTypeId) {
    // The date range carries over between types; filters don't — each type
    // declares its own keys.
    setParams((current) => ({ range: current.range, filters: {} }));
    generate.reset();
    setView({ step: "form", typeId });
  }

  function runGeneration(input: GenerateReportInput) {
    generate.mutate(input, {
      onSuccess: (report) => {
        setView({
          step: "report",
          reportId: report.id,
          typeId: report.type,
          from: "form",
        });
      },
      onError: (error) => {
        toast.error(
          error instanceof ReportsApiError
            ? error.message
            : "Couldn't queue this report. Please try again."
        );
      },
    });
  }

  function regenerate(report: Report) {
    const next = paramsFromReport(report);
    setParams(next);
    runGeneration({ typeId: report.type, params: next });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Reports
        </h1>
        <p className="text-sm text-muted-foreground">
          Generate platform reports over a date range, preview them, and
          download the full CSV.
        </p>
      </div>

      {showGallery && (
        <>
          <ReportTypeGallery
            types={reportTypes.data}
            isLoading={reportTypes.isLoading}
            error={reportTypes.error}
            onRetry={() => reportTypes.refetch()}
            onSelect={openForm}
          />
          <RecentReports
            reports={recentReports.data?.reports}
            meta={recentReports.data?.meta}
            isLoading={recentReports.isLoading}
            isRefreshing={recentReports.isPlaceholderData}
            error={recentReports.error}
            onRetry={() => recentReports.refetch()}
            types={reportTypes.data}
            filters={listFilters}
            onFiltersChange={(next) => {
              setListFilters(next);
              setListPage(1);
            }}
            page={listPage}
            onPageChange={setListPage}
            onOpen={(report) =>
              setView({
                step: "report",
                reportId: report.id,
                typeId: report.type,
                from: "list",
              })
            }
            onDownload={download}
            downloadingId={downloadingId}
          />
        </>
      )}

      {view.step === "form" && formType && (
        <ParameterForm
          key={formType.id}
          type={formType}
          params={params}
          onParamsChange={setParams}
          onBack={() => setView({ step: "gallery" })}
          onGenerate={() => runGeneration({ typeId: formType.id, params })}
          isGenerating={generate.isPending}
        />
      )}

      {view.step === "report" && (
        <ReportPreview
          key={view.reportId}
          reportId={view.reportId}
          type={findType(view.typeId)}
          backLabel={
            view.from === "list" ? "Back to reports" : "Change parameters"
          }
          onBack={() =>
            setView(
              view.from === "form"
                ? { step: "form", typeId: view.typeId }
                : { step: "gallery" }
            )
          }
          onRegenerate={regenerate}
          isRegenerating={generate.isPending}
        />
      )}
    </div>
  );
}
