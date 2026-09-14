"use client";

import { toast } from "sonner";
import { ReportsApiError, useDownloadReport } from "@/features/reports/api";
import type { Report } from "@/features/reports/types";

/**
 * CSV download with the error toast attached, shared by the recent-reports
 * list and the report screen. `downloadingId` lets a list show the spinner on
 * the one row that's downloading.
 */
export function useReportDownload() {
  const mutation = useDownloadReport();

  function download(report: Report) {
    mutation.mutate(report, {
      onError: (error) => {
        toast.error(
          error instanceof ReportsApiError
            ? error.message
            : "Couldn't download this report. Please try again."
        );
      },
    });
  }

  return {
    download,
    downloadingId: mutation.isPending ? (mutation.variables?.id ?? null) : null,
  };
}
