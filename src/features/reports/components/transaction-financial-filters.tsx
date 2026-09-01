import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRANSACTION_TYPE_OPTIONS } from "@/features/wallet/constants";
import type {
  ReportParams,
  TransactionTypeFilter,
} from "@/features/reports/types";

function labelFor(value: TransactionTypeFilter): string {
  if (value === "all") return "All";
  return (
    TRANSACTION_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}

/**
 * Report-specific filter for the Transaction & Financial report — fills RP1's
 * extension point. Options are the exact categories from the "All Transactions"
 * tab (`TRANSACTION_TYPE_OPTIONS`) plus "All".
 */
export function TransactionFinancialFilters({
  params,
  onChange,
}: {
  params: ReportParams;
  onChange: (params: ReportParams) => void;
}) {
  const value: TransactionTypeFilter = params.transactionType ?? "all";

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="report-transaction-type">Transaction Type</Label>
      <Select
        value={value}
        onValueChange={(next) =>
          onChange({
            ...params,
            transactionType: next as TransactionTypeFilter,
          })
        }
      >
        <SelectTrigger id="report-transaction-type" className="w-full sm:w-72">
          <SelectValue>{labelFor(value)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {TRANSACTION_TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
