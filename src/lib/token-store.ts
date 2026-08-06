import type { CurrentAdmin } from "@/types/admin";

const STORAGE_KEY = "beevia_admin_session";

interface StoredSession {
  accessToken: string;
  admin: CurrentAdmin;
}

let accessToken: string | null = null;
let currentAdmin: CurrentAdmin | null = null;

function readStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

// Hydrate synchronously on module load so a page refresh doesn't drop the
// session (there's no /me or /auth/refresh endpoint to recover it from).
const stored = readStoredSession();
if (stored) {
  accessToken = stored.accessToken;
  currentAdmin = stored.admin;
}

export function getAccessToken() {
  return accessToken;
}

export function getStoredAdmin() {
  return currentAdmin;
}

export function setSession(admin: CurrentAdmin, token: string) {
  accessToken = token;
  currentAdmin = admin;
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accessToken: token, admin })
    );
  }
}

export function clearSession() {
  accessToken = null;
  currentAdmin = null;
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
}
