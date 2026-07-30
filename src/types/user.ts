export type UserAccountStatus = "active" | "restricted" | "suspended";
export type VerificationStatus = "verified" | "pending" | "failed";
export type WalletStatus = "none" | "active" | "frozen" | "pending";
export type AccountType = "chat_only" | "chat_banking";

export interface AppUser {
  id: string;
  userCode: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  country: string;
  avatarColor: string;
  accountType: AccountType;
  verification: VerificationStatus;
  walletStatus: WalletStatus;
  status: UserAccountStatus;
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
