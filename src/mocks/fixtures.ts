import type { AdminAccount, AdminRole, CurrentAdmin } from "@/types/admin";
import type {
  AccountType,
  AppUser,
  AuditEntry,
  CaseNote,
  KycResult,
  KycVerificationMethod,
  UserAccountStatus,
  VerificationStatus,
  WalletStatus,
} from "@/types/user";
import { ONBOARDING_STEPS_ORDER } from "@/features/users/onboarding";

export const DEMO_ACCOUNTS: { email: string; name: string; role: AdminRole }[] =
  [
    { email: "support@beevia.dev", name: "Sam Support", role: "support" },
    {
      email: "compliance@beevia.dev",
      name: "Cam Compliance",
      role: "compliance",
    },
    { email: "admin@beevia.dev", name: "Ada Admin", role: "super_admin" },
  ];

const HOUR_MS = 60 * 60 * 1000;

export const mockAdminAccounts: AdminAccount[] = [
  {
    id: "admin-1",
    name: "Ada Admin",
    username: "@adaa",
    email: "admin@beevia.dev",
    role: "super_admin",
    avatarColor: "bg-rose-500",
    accessLevel: "full",
    status: "active",
    createdAt: "2024-11-01T09:00:00.000Z",
    lastActiveAt: new Date(Date.now() - 2 * HOUR_MS).toISOString(),
  },
  {
    id: "admin-2",
    name: "Cam Compliance",
    username: "@camc",
    email: "compliance@beevia.dev",
    role: "compliance",
    avatarColor: "bg-sky-500",
    accessLevel: "limited",
    status: "active",
    createdAt: "2025-02-14T09:00:00.000Z",
    lastActiveAt: new Date(Date.now() - 26 * HOUR_MS).toISOString(),
  },
  {
    id: "admin-3",
    name: "Sam Support",
    username: "@sams",
    email: "support@beevia.dev",
    role: "support",
    avatarColor: "bg-emerald-500",
    accessLevel: "read_only",
    status: "active",
    createdAt: "2025-01-10T09:00:00.000Z",
    lastActiveAt: new Date(Date.now() - 3 * 24 * HOUR_MS).toISOString(),
  },
  {
    id: "admin-4",
    name: "Ifeoma Okeke",
    username: "@ifeomao",
    email: "ifeoma.okeke@beevia.dev",
    role: "super_admin",
    avatarColor: "bg-violet-500",
    accessLevel: "full",
    status: "active",
    createdAt: "2025-03-05T09:00:00.000Z",
    lastActiveAt: new Date(Date.now() - 5 * HOUR_MS).toISOString(),
  },
  {
    id: "admin-5",
    name: "Ethan Johnson",
    username: "@ethanj",
    email: "ethan.johnson@beevia.dev",
    role: "compliance",
    avatarColor: "bg-amber-500",
    accessLevel: "limited",
    status: "inactive",
    createdAt: "2025-04-18T09:00:00.000Z",
    lastActiveAt: new Date(Date.now() - 21 * 24 * HOUR_MS).toISOString(),
  },
  {
    id: "admin-6",
    name: "Ngozi Aduba",
    username: "@ngozia",
    email: "ngozi.aduba@beevia.dev",
    role: "support",
    avatarColor: "bg-teal-500",
    accessLevel: "read_only",
    status: "inactive",
    createdAt: "2025-05-22T09:00:00.000Z",
    lastActiveAt: new Date(Date.now() - 30 * 24 * HOUR_MS).toISOString(),
  },
];

const FIRST_NAMES = [
  "Jordan",
  "Priya",
  "Marcus",
  "Elena",
  "Ifeoma",
  "Chidi",
  "Ngozi",
  "Ikenna",
  "Olivia",
  "Ethan",
  "Noah",
  "Sophia",
  "Liam",
  "Ava",
  "Kwame",
  "Amara",
  "Diego",
  "Hana",
  "Lucas",
  "Mei",
  "Omar",
  "Freya",
  "Tariq",
  "Isabel",
  "Kenji",
  "Zainab",
  "Felix",
  "Nadia",
  "Victor",
  "Sana",
] as const;

const LAST_NAMES = [
  "Rivera",
  "Nair",
  "Webb",
  "Fischer",
  "Okeke",
  "Mokelu",
  "Aduba",
  "Okorie",
  "Brown",
  "Johnson",
  "Davis",
  "Mars",
  "Carter",
  "Wilson",
  "Mensah",
  "Diallo",
  "Torres",
  "Suzuki",
  "Bennett",
  "Chen",
  "Farouk",
  "Larsen",
  "Haddad",
  "Cruz",
  "Yamamoto",
  "Bello",
  "Novak",
  "Rahman",
  "Petrov",
  "Karim",
] as const;

const COUNTRIES: { name: string; dialCode: string }[] = [
  { name: "Nigeria", dialCode: "234" },
  { name: "United States", dialCode: "1" },
  { name: "United Kingdom", dialCode: "44" },
  { name: "Australia", dialCode: "61" },
  { name: "Japan", dialCode: "81" },
  { name: "France", dialCode: "33" },
  { name: "Spain", dialCode: "34" },
  { name: "Italy", dialCode: "39" },
  { name: "China", dialCode: "86" },
  { name: "Germany", dialCode: "49" },
];

const AVATAR_PALETTE = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-pink-500",
];

const STATUS_POOL: UserAccountStatus[] = [
  "active",
  "active",
  "active",
  "active",
  "active",
  "active",
  "active",
  "restricted",
  "restricted",
  "suspended",
];
const VERIFICATION_POOL: VerificationStatus[] = [
  "verified",
  "verified",
  "verified",
  "verified",
  "verified",
  "verified",
  "pending",
  "pending",
  "failed",
];
const WALLET_POOL: WalletStatus[] = [
  "active",
  "active",
  "active",
  "frozen",
  "pending",
];

const DAY_MS = 24 * 60 * 60 * 1000;

const KYC_METHOD_POOL: KycVerificationMethod[] = ["face", "record"];
const KYC_RESULT_POOL: KycResult[] = [
  "passed",
  "passed",
  "passed",
  "pending",
  "failed",
];

function generateMockUsers(count: number): AppUser[] {
  const now = Date.now();

  return Array.from({ length: count }, (_, i) => {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 7) % LAST_NAMES.length];
    const country = COUNTRIES[(i * 3) % COUNTRIES.length];
    const accountType: AccountType = i % 5 < 3 ? "chat_only" : "chat_banking";
    const status = STATUS_POOL[i % STATUS_POOL.length];
    const verification = VERIFICATION_POOL[i % VERIFICATION_POOL.length];
    const walletStatus: WalletStatus =
      accountType === "chat_only"
        ? "none"
        : WALLET_POOL[i % WALLET_POOL.length];

    const createdAt = new Date(now - (i * 9 + 5) * DAY_MS).toISOString();
    const lastActiveAt = new Date(
      now - ((i * 5) % 30) * DAY_MS - (i % 24) * 3600_000
    ).toISOString();

    // Every 7th user is still mid-onboarding so the "stuck" state is testable.
    const onboardingStepIndex = i % 7;
    const onboardingStatus =
      onboardingStepIndex < ONBOARDING_STEPS_ORDER.length
        ? "in_progress"
        : "complete";
    const onboardingStep =
      onboardingStatus === "in_progress"
        ? ONBOARDING_STEPS_ORDER[onboardingStepIndex]
        : null;

    const dateOfBirth =
      onboardingStep === "profile_details"
        ? null
        : new Date(
            now - (24 + (i % 40)) * 365 * DAY_MS - (i % 28) * DAY_MS
          ).toISOString();

    const hasKyc =
      accountType === "chat_banking" && onboardingStatus === "complete";
    const kyc = hasKyc
      ? {
          method: KYC_METHOD_POOL[i % KYC_METHOD_POOL.length],
          result: KYC_RESULT_POOL[i % KYC_RESULT_POOL.length],
          verifiedAt: new Date(now - (i * 3 + 2) * DAY_MS).toISOString(),
          bvnLast4: String(1000 + ((i * 37) % 9000)).slice(-4),
        }
      : null;

    return {
      id: `user-${i + 1}`,
      userCode: `#BVA${1100 + i}`,
      fullName: `${firstName} ${lastName}`,
      username: `@${firstName.toLowerCase()}${lastName[0].toLowerCase()}`,
      email:
        accountType === "chat_only" && i % 4 === 0
          ? null
          : `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: `+${country.dialCode} ${String(1000000 + i * 7919).slice(0, 9)}`,
      dateOfBirth,
      country: country.name,
      avatarColor: AVATAR_PALETTE[i % AVATAR_PALETTE.length],
      accountType,
      verification,
      walletStatus,
      status,
      onboardingStatus,
      onboardingStep,
      kyc,
      createdAt,
      lastActiveAt,
    } satisfies AppUser;
  });
}

export const mockUsers: AppUser[] = generateMockUsers(96);

export const mockCaseNotes: Record<string, CaseNote[]> = {
  "user-2": [
    {
      id: "note-1",
      userId: "user-2",
      authorId: "admin-2",
      authorName: "Cam Compliance",
      body: "Flagged for unusual transfer pattern; account suspended pending review.",
      createdAt: "2025-01-18T14:30:00.000Z",
    },
  ],
};

export const mockAuditTrail: Record<string, AuditEntry[]> = {
  "user-2": [
    {
      id: "audit-1",
      userId: "user-2",
      action: "suspended",
      reason: "suspicious_login_activity",
      note: "Multiple failed login attempts from a new device.",
      actingAdminName: "Cam Compliance",
      createdAt: "2025-01-18T14:30:00.000Z",
    },
  ],
};

export function findDemoAccountByEmail(email: string) {
  return DEMO_ACCOUNTS.find(
    (account) => account.email.toLowerCase() === email.toLowerCase()
  );
}

let currentMockAdmin: CurrentAdmin = {
  id: "admin-3",
  name: "Ada Admin",
  email: "admin@beevia.dev",
  role: "super_admin",
};

export function getCurrentMockAdmin(): CurrentAdmin {
  return currentMockAdmin;
}

export function setCurrentMockAdmin(admin: CurrentAdmin) {
  currentMockAdmin = admin;
}
