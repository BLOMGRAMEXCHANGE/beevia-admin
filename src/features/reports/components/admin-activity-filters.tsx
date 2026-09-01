import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ADMIN_ACTIVITY_TYPE_LABELS,
  type AdminActivityTypeFilter,
  type ReportParams,
} from "@/features/reports/types";

const OPTIONS = Object.keys(
  ADMIN_ACTIVITY_TYPE_LABELS
) as AdminActivityTypeFilter[];

/**
 * Report-specific filter for the Admin Activity / Audit report — fills RP1's
 * extension point. Options match Dashboard Home's four activity event types.
 */
export function AdminActivityFilters({
  params,
  onChange,
}: {
  params: ReportParams;
  onChange: (params: ReportParams) => void;
}) {
  const value: AdminActivityTypeFilter = params.adminActivityType ?? "all";

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="report-admin-activity-type">Action Type</Label>
      <Select
        value={value}
        onValueChange={(next) =>
          onChange({
            ...params,
            adminActivityType: next as AdminActivityTypeFilter,
          })
        }
      >
        <SelectTrigger
          id="report-admin-activity-type"
          className="w-full sm:w-72"
        >
          <SelectValue>{ADMIN_ACTIVITY_TYPE_LABELS[value]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {ADMIN_ACTIVITY_TYPE_LABELS[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
