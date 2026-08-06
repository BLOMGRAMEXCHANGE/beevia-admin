import type { AdminRole } from "@/types/admin";
import type { SuspensionReason } from "@/types/user";

interface SuspensionReasonOption {
  value: SuspensionReason;
  label: string;
}

export const ACCOUNT_SAFETY_REASONS: SuspensionReasonOption[] = [
  { value: "user_requested", label: "User requested" },
  { value: "suspicious_login_activity", label: "Suspicious login activity" },
  { value: "lost_device", label: "Lost or stolen device" },
];

export const POLICY_VIOLATION_REASONS: SuspensionReasonOption[] = [
  { value: "terms_violation", label: "Terms of service violation" },
  { value: "fraud_investigation", label: "Fraud investigation" },
];

export const SUSPENSION_REASON_LABEL: Record<SuspensionReason, string> =
  Object.fromEntries(
    [...ACCOUNT_SAFETY_REASONS, ...POLICY_VIOLATION_REASONS].map((option) => [
      option.value,
      option.label,
    ])
  ) as Record<SuspensionReason, string>;

export function getSuspensionReasonOptions(
  role: AdminRole
): SuspensionReasonOption[] {
  if (role === "compliance" || role === "super_admin") {
    return [...ACCOUNT_SAFETY_REASONS, ...POLICY_VIOLATION_REASONS];
  }
  return ACCOUNT_SAFETY_REASONS;
}
