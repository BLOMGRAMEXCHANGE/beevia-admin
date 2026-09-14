import { ChevronRight, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportsApiError } from "@/features/reports/api";
import { iconForReportType } from "@/features/reports/report-catalogue";
import type { ReportType, ReportTypeId } from "@/features/reports/types";

function GalleryMessage({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <FileQuestion className="size-6 text-muted-foreground" />
      <p className="text-sm font-medium">{title}</p>
      {children}
    </Card>
  );
}

/**
 * The landing gallery — one card per report type the backend offers this admin.
 * Descriptions are the backend's own, and can run to a few sentences, so cards
 * clamp them; the full text is repeated on the parameter form.
 */
export function ReportTypeGallery({
  types,
  isLoading,
  error,
  onRetry,
  onSelect,
}: {
  types: ReportType[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  onSelect: (typeId: ReportTypeId) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-44 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    const isForbidden =
      error instanceof ReportsApiError && error.status === 403;
    return (
      <GalleryMessage
        title={
          isForbidden
            ? "You don't have access to reports"
            : "Couldn't load report types"
        }
      >
        {isForbidden ? (
          <p className="max-w-sm text-sm text-muted-foreground">
            {error.message}
          </p>
        ) : (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )}
      </GalleryMessage>
    );
  }

  if (!types || types.length === 0) {
    return (
      <GalleryMessage title="No reports available">
        <p className="max-w-sm text-sm text-muted-foreground">
          Your role doesn&apos;t include any modules that have reports.
        </p>
      </GalleryMessage>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {types.map((type) => {
        const Icon = iconForReportType(type.id);
        return (
          <Card key={type.id} className="p-0">
            <button
              type="button"
              onClick={() => onSelect(type.id)}
              title={type.description}
              className="flex h-full w-full flex-col gap-3 rounded-xl p-4 text-left hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-4" />
              </span>
              <span className="flex items-center gap-1 font-medium">
                {type.label}
                <ChevronRight className="size-4 text-muted-foreground" />
              </span>
              <span className="line-clamp-3 text-sm text-muted-foreground">
                {type.description}
              </span>
            </button>
          </Card>
        );
      })}
    </div>
  );
}
