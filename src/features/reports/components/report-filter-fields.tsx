import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ANY_FILTER_VALUE,
  type ReportFilterDef,
  type ReportParams,
} from "@/features/reports/types";

/**
 * Renders a report type's filters straight from its catalogue entry — one
 * single-select per filter, each with an "All" option that means "don't filter
 * on this key". No filter is hard-coded here: whatever the backend declares for
 * the selected report type is what the admin sees.
 */
export function ReportFilterFields({
  filters,
  params,
  onChange,
}: {
  filters: ReportFilterDef[];
  params: ReportParams;
  onChange: (params: ReportParams) => void;
}) {
  if (filters.length === 0) return null;

  function setFilter(key: string, value: string) {
    onChange({ ...params, filters: { ...params.filters, [key]: value } });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {filters.map((filter) => {
        const value = params.filters[filter.key] ?? ANY_FILTER_VALUE;
        const selected = filter.options.find(
          (option) => option.value === value
        );
        return (
          <div key={filter.key} className="flex flex-col gap-1.5">
            <Label htmlFor={`report-filter-${filter.key}`}>
              {filter.label}
            </Label>
            <Select
              value={value}
              onValueChange={(next) => setFilter(filter.key, String(next))}
            >
              <SelectTrigger
                id={`report-filter-${filter.key}`}
                className="w-full"
              >
                <SelectValue>{selected?.label ?? "All"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY_FILTER_VALUE}>All</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}
    </div>
  );
}
