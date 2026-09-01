"use client";

import { useState } from "react";
import { ReportTypeGallery } from "@/features/reports/components/report-type-gallery";
import { ParameterForm } from "@/features/reports/components/parameter-form";
import { ReportPreview } from "@/features/reports/components/report-preview";
import { RecentReports } from "@/features/reports/components/recent-reports";
import { useGenerateReport, useRecentReports } from "@/features/reports/api";
import { buildGeneratedReport } from "@/features/reports/mock-data";
import type {
  DateRange,
  GeneratedReport,
  RecentReport,
  ReportParams,
  ReportTypeId,
} from "@/features/reports/types";

type View =
  | { step: "gallery" }
  | { step: "form"; typeId: ReportTypeId }
  | { step: "preview"; report: GeneratedReport; from: "form" | "history" };

function defaultRange(): DateRange {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const first = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return { from: first, to: today };
}

/** Fresh params for a newly opened form, seeded with any report-specific
 *  filter defaults. */
function initialParams(typeId: ReportTypeId): ReportParams {
  const params: ReportParams = { range: defaultRange() };
  if (typeId === "user_kyc") params.accountType = "all";
  if (typeId === "transaction_financial") params.transactionType = "all";
  if (typeId === "admin_activity") params.adminActivityType = "all";
  return params;
}

export function ReportsView() {
  const [view, setView] = useState<View>({ step: "gallery" });
  const [params, setParams] = useState<ReportParams>(() => ({
    range: defaultRange(),
  }));

  const recentReports = useRecentReports();
  const generate = useGenerateReport();

  function openForm(typeId: ReportTypeId) {
    setParams(initialParams(typeId));
    setView({ step: "form", typeId });
  }

  function handleGenerate(typeId: ReportTypeId) {
    generate.mutate(
      { typeId, params },
      {
        onSuccess: (report) =>
          setView({ step: "preview", report, from: "form" }),
      }
    );
  }

  function reopen(report: RecentReport) {
    // Reopening just shows the same generic placeholder preview using this
    // entry's stored parameters — no re-generation needed for RP1.
    setView({
      step: "preview",
      report: buildGeneratedReport(
        report.typeId,
        report.params,
        new Date(report.generatedAt).getTime()
      ),
      from: "history",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Reports
        </h1>
        <p className="text-sm text-muted-foreground">
          Generate platform reports over a date range.
        </p>
      </div>

      {view.step === "gallery" && (
        <>
          <ReportTypeGallery onSelect={openForm} />
          <RecentReports
            reports={recentReports.data}
            isLoading={recentReports.isLoading}
            onReopen={reopen}
          />
        </>
      )}

      {view.step === "form" && (
        <ParameterForm
          typeId={view.typeId}
          params={params}
          onParamsChange={setParams}
          onBack={() => {
            generate.reset();
            setView({ step: "gallery" });
          }}
          onGenerate={() => handleGenerate(view.typeId)}
          isGenerating={generate.isPending}
        />
      )}

      {view.step === "preview" && (
        <ReportPreview
          report={view.report}
          backLabel={
            view.from === "history" ? "Back to reports" : "Back to report types"
          }
          onBack={() => {
            generate.reset();
            setView(
              view.from === "history"
                ? { step: "gallery" }
                : { step: "form", typeId: view.report.typeId }
            );
          }}
        />
      )}
    </div>
  );
}
