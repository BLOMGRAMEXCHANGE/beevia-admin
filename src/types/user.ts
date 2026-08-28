export type UserAccountStatus =
  | "active"
  | "restricted"
  | "suspended"
  | "deactivated"
  | "deleting"
  | "deleted";
export type VerificationStatus = "verified" | "pending" | "failed";
export type WalletStatus = "none" | "active" | "frozen" | "closed";
export type AccountType = "chat_only" | "chat_banking";

export interface UserRecord {
  id: string;
  fullName: string | null;
  username: string;
  email: string | null;
  phone: string;
  country: string;
  avatarUrl: string | null;
  accountType: AccountType;
  verification: VerificationStatus;
  wallet: WalletStatus;
  status: UserAccountStatus;
  joinedAt: string;
  lastActiveAt: string | null;
}

export interface UsersListPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RecentSearchUser {
  id: string;
  fullName: string | null;
  username: string;
  avatarUrl: string | null;
}

export interface RecentSearches {
  terms: string[];
  users: RecentSearchUser[];
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

export interface CaseNote {
  id: string;
  category: string;
  body: string;
  authorFullName: string;
  createdAt: string;
}

export interface VerificationCheck {
  type: string;
  status: string;
  provider: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  failedAttempts: number;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  maskedValue: string | null;
}

/** Shape of `GET /admin/users/:userId/verification`. */
export interface VerificationDetail {
  kycLevel: string;
  checksPassed: number;
  checksTotal: number;
  outstandingChecks: string[];
  checks: VerificationCheck[];
}

/** Shape of an item from `GET /admin/users/:userId/actions`. `actionType`,
 * `previousStatus`, and `newStatus` are kept as open strings for the same
 * forward-compat reason as VerificationCheck above. */
export interface UserActionHistoryEntry {
  id: string;
  adminId: string;
  actionType: string;
  reason: string | null;
  note: string | null;
  previousStatus: string;
  newStatus: string;
  createdAt: string;
}
