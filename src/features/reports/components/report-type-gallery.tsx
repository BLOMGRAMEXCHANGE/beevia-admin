import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { REPORT_TYPES } from "@/features/reports/report-types";
import type { ReportTypeId } from "@/features/reports/types";

/**
 * The landing gallery. Rendered by mapping over `REPORT_TYPES` — adding a report
 * type is one array entry, not a new card component.
 */
export function ReportTypeGallery({
  onSelect,
}: {
  onSelect: (typeId: ReportTypeId) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {REPORT_TYPES.map((type) => (
        <Card key={type.id} className="p-0">
          <button
            type="button"
            onClick={() => onSelect(type.id)}
            className="flex h-full w-full flex-col gap-3 rounded-xl p-4 text-left hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <type.icon className="size-4" />
            </span>
            <span className="flex items-center gap-1 font-medium">
              {type.title}
              <ChevronRight className="size-4 text-muted-foreground" />
            </span>
            <span className="text-sm text-muted-foreground">
              {type.description}
            </span>
          </button>
        </Card>
      ))}
    </div>
  );
}
