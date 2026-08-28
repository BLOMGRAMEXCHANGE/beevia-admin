import type { StatusTone } from "@/components/shared/status-badge";

export type CaseNoteCategory =
  | "kyc"
  | "fraud"
  | "compliance"
  | "support"
  | "transaction"
  | "account_status"
  | "legal"
  | "other";

export const CASE_NOTE_CATEGORIES: {
  value: CaseNoteCategory;
  label: string;
  tone: StatusTone;
}[] = [
  { value: "kyc", label: "KYC", tone: "blue" },
  { value: "fraud", label: "Fraud", tone: "red" },
  { value: "compliance", label: "Compliance", tone: "amber" },
  { value: "support", label: "Support", tone: "green" },
  { value: "transaction", label: "Transaction", tone: "blue" },
  { value: "account_status", label: "Account Status", tone: "amber" },
  { value: "legal", label: "Legal", tone: "red" },
  { value: "other", label: "Other", tone: "gray" },
];

export const CASE_NOTE_CATEGORY_LABEL: Record<string, string> =
  Object.fromEntries(CASE_NOTE_CATEGORIES.map((c) => [c.value, c.label]));

export const CASE_NOTE_CATEGORY_TONE: Record<string, StatusTone> =
  Object.fromEntries(CASE_NOTE_CATEGORIES.map((c) => [c.value, c.tone]));
