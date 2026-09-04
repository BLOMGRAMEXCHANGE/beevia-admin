import type { StatusTone } from "@/components/shared/status-badge";
import type {
  DiscrepancyType,
  ReconciliationBucketKey,
} from "@/features/reconciliation/types";

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

// ---------------------------------------------------------------------------
// Live reconciliation bucket labels — same three-category semantics as the
// mock model above (in_beevia_not_anchor === old "missing_in_anchor";
// in_anchor_not_beevia === old "missing_in_beevia"), renamed to match the real
// `GET /admin/reconciliation/users/{id}` response keys.
// ---------------------------------------------------------------------------

export const RECONCILIATION_BUCKET_LABEL: Record<
  ReconciliationBucketKey,
  string
> = {
  in_beevia_not_anchor: "In Beevia, not Anchor",
  in_anchor_not_beevia: "In Anchor, not Beevia",
  amount_mismatch: "Amount Mismatch",
};

export const RECONCILIATION_BUCKET_TONE: Record<
  ReconciliationBucketKey,
  StatusTone
> = {
  // Beevia has a record Anchor doesn't — possible phantom/duplicated credit.
  in_beevia_not_anchor: "red",
  // Anchor moved money Beevia's ledger doesn't reflect — usually the more
  // urgent case (a real transfer a user may not see).
  in_anchor_not_beevia: "amber",
  amount_mismatch: "amber",
};

export const RECONCILIATION_BUCKET_DESCRIPTION: Record<
  ReconciliationBucketKey,
  string
> = {
  in_beevia_not_anchor:
    "Beevia has a record of this transaction, but it does not appear in Anchor's records.",
  in_anchor_not_beevia:
    "Anchor processed this transaction, but Beevia's ledger has no matching record of it.",
  amount_mismatch:
    "Both systems have a record of this transaction, but the recorded amounts do not match.",
};
