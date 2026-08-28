import { StatusBadge } from "@/components/shared/status-badge";
import {
  DISCREPANCY_LABEL,
  DISCREPANCY_TONE,
} from "@/features/reconciliation/constants";
import type { DiscrepancyType } from "@/features/reconciliation/types";

export function DiscrepancyTypeBadge({ type }: { type: DiscrepancyType }) {
  return (
    <StatusBadge tone={DISCREPANCY_TONE[type]}>
      {DISCREPANCY_LABEL[type]}
    </StatusBadge>
  );
}
