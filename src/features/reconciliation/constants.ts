import type { StatusTone } from "@/components/shared/status-badge";
import type { DiscrepancyType } from "@/features/reconciliation/types";

export const DISCREPANCY_LABEL: Record<DiscrepancyType, string> = {
  missing_in_anchor: "Missing in Anchor",
  missing_in_beevia: "Missing in Beevia",
  amount_mismatch: "Amount Mismatch",
};

export const DISCREPANCY_TONE: Record<DiscrepancyType, StatusTone> = {
  // Phantom / duplicated internal credit — an integrity concern.
  missing_in_anchor: "red",
  // Real transfer that never hit the user's balance — usually the most urgent.
  missing_in_beevia: "amber",
  amount_mismatch: "amber",
};

export const DISCREPANCY_DESCRIPTION: Record<DiscrepancyType, string> = {
  missing_in_anchor:
    "Beevia has a record of this transaction, but it does not appear in Anchor's records — a possible phantom or duplicated internal credit.",
  missing_in_beevia:
    "Anchor processed this transaction, but Beevia's ledger has no record of it — likely a missed webhook, so a real transfer never got reflected in the user's balance.",
  amount_mismatch:
    "Both systems have a record of this transaction, but the recorded amounts do not match.",
};

/** Roles allowed to run Anchor reconciliation (see summary — pending sign-off). */
export const RECONCILIATION_ROLES = ["compliance", "super_admin"] as const;
