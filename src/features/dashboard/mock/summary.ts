/**
 * Mock payloads for the three summary cards. Each shape matches the slice of a
 * real summary endpoint the card needs, so wiring a fetch later is a 1:1 swap.
 */
export interface UsersSummary {
  total: number;
  verified: number;
  pending: number;
  failed: number;
}

export interface AdminAccountsSummary {
  total: number;
}

export interface RolesSummary {
  total: number;
}

export const MOCK_USERS_SUMMARY: UsersSummary = {
  total: 48213,
  verified: 39104,
  pending: 7260,
  failed: 1849,
};

export const MOCK_ADMIN_ACCOUNTS_SUMMARY: AdminAccountsSummary = { total: 14 };

export const MOCK_ROLES_SUMMARY: RolesSummary = { total: 6 };

/** Per-card mock latency so the cards resolve independently, not in lockstep. */
export const SUMMARY_CARD_DELAYS = {
  users: 700,
  adminAccounts: 1400,
  roles: 1050,
} as const;
