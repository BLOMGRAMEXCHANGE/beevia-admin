export type UserAccountStatus = "active" | "restricted" | "suspended";
export type VerificationStatus = "verified" | "pending" | "failed";
export type WalletStatus = "none" | "active" | "frozen" | "pending";
export type AccountType = "chat_only" | "chat_banking";

export type OnboardingStatus = "in_progress" | "complete";
export type OnboardingStep =
  | "profile_details"
  | "phone_verification"
  | "kyc_verification"
  | "wallet_setup";

export type KycVerificationMethod = "face" | "record";
export type KycResult = "passed" | "failed" | "pending";

// bvnLast4 is the only BVN fragment ever carried by this type — the full
// number must never be modeled or transmitted, in mocks or the real API.
export interface KycDetail {
  method: KycVerificationMethod;
  result: KycResult;
  verifiedAt: string;
  bvnLast4: string;
}

export type SuspensionReason =
  | "user_requested"
  | "suspicious_login_activity"
  | "lost_device"
  | "terms_violation"
  | "fraud_investigation";

export type AuditAction = "suspended" | "reactivated";

export interface AuditEntry {
  id: string;
  userId: string;
  action: AuditAction;
  reason?: SuspensionReason;
  note?: string;
  actingAdminName: string;
  createdAt: string;
}

export interface AppUser {
  id: string;
  userCode: string;
  fullName: string;
  username: string;
  email: string | null;
  phone: string;
  dateOfBirth: string | null;
  country: string;
  avatarColor: string;
  accountType: AccountType;
  verification: VerificationStatus;
  walletStatus: WalletStatus;
  status: UserAccountStatus;
  onboardingStatus: OnboardingStatus;
  onboardingStep: OnboardingStep | null;
  kyc: KycDetail | null;
  createdAt: string;
  lastActiveAt: string;
}

export interface CaseNote {
  id: string;
  userId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}
