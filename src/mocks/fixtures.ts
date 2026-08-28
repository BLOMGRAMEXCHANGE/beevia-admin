import type { AdminRole, CurrentAdmin } from "@/types/admin";
import type { AuditEntry } from "@/types/user";

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
