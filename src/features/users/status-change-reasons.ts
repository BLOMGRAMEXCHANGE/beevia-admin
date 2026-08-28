export type UserStatusChangeReason =
  | "fraud_investigation"
  | "compliance_review"
  | "regulatory_or_legal_request"
  | "policy_violation"
  | "user_request"
  | "other";

export const USER_STATUS_CHANGE_REASONS: {
  value: UserStatusChangeReason;
  label: string;
}[] = [
  { value: "fraud_investigation", label: "Fraud investigation" },
  { value: "compliance_review", label: "Compliance review" },
  {
    value: "regulatory_or_legal_request",
    label: "Regulatory or legal request",
  },
  { value: "policy_violation", label: "Policy violation" },
  { value: "user_request", label: "User request" },
  { value: "other", label: "Other" },
];
