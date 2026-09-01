import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACCOUNT_TYPE_LABELS,
  type AccountTypeFilter,
  type ReportParams,
} from "@/features/reports/types";

const OPTIONS: AccountTypeFilter[] = ["all", "chat_only", "chat_banking"];

/**
 * Report-specific filter for the User & KYC report — fills RP1's extension
 * point in the parameter form. Setting a specific account type narrows the
 * generated report to that segment.
 */
export function UserKycFilters({
  params,
  onChange,
}: {
  params: ReportParams;
  onChange: (params: ReportParams) => void;
}) {
  const value: AccountTypeFilter = params.accountType ?? "all";

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="report-account-type">Account Type</Label>
      <Select
        value={value}
        onValueChange={(next) =>
          onChange({ ...params, accountType: next as AccountTypeFilter })
        }
      >
        <SelectTrigger id="report-account-type" className="w-full sm:w-64">
          <SelectValue>{ACCOUNT_TYPE_LABELS[value]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {ACCOUNT_TYPE_LABELS[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
