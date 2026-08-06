import { AxiosError, AxiosHeaders } from "axios";
import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import type {
  AdminAccessLevel,
  AdminAccount,
  AdminAccountStatus,
  AdminRole,
} from "@/types/admin";
import type {
  AppUser,
  AuditEntry,
  CaseNote,
  SuspensionReason,
  UserAccountStatus,
} from "@/types/user";
import {
  findDemoAccountByEmail,
  getCurrentMockAdmin,
  mockAdminAccounts,
  mockAuditTrail,
  mockCaseNotes,
  mockUsers,
  setCurrentMockAdmin,
} from "@/mocks/fixtures";

function parseBody(
  config: InternalAxiosRequestConfig
): Record<string, unknown> {
  if (typeof config.data === "string") {
    try {
      return JSON.parse(config.data);
    } catch {
      return {};
    }
  }
  return (config.data as Record<string, unknown>) ?? {};
}

function ok<T>(data: T, config: InternalAxiosRequestConfig): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: "OK",
    headers: new AxiosHeaders(),
    config,
  };
}

function updateById<T extends { id: string }>(
  list: T[],
  id: string,
  patch: Partial<T>
): T | undefined {
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return undefined;
  const updated = { ...list[index], ...patch };
  list[index] = updated;
  return updated;
}

function notFound(config: InternalAxiosRequestConfig) {
  return Promise.reject(
    new AxiosError("Not found", "ERR_MOCK_404", config, undefined, {
      data: { message: "Not found" },
      status: 404,
      statusText: "Not Found",
      headers: new AxiosHeaders(),
      config,
    })
  );
}

export const mockAdapter: AxiosAdapter = async (config) => {
  const method = (config.method ?? "get").toLowerCase();
  const url = config.url ?? "";

  if (method === "post" && url === "/auth/login") {
    const { email } = parseBody(config) as { email?: string };
    const demoAccount = email ? findDemoAccountByEmail(email) : undefined;
    const role: AdminRole = demoAccount?.role ?? "support";
    setCurrentMockAdmin({
      id: demoAccount ? `admin-${role}` : "admin-guest",
      name: demoAccount?.name ?? "Demo Admin",
      email: email ?? "demo@beevia.dev",
      role,
    });

    return ok({ accessToken: "mock-access-token", role }, config);
  }

  if (method === "post" && url === "/auth/refresh") {
    return ok({ accessToken: "mock-access-token" }, config);
  }

  if (method === "get" && url === "/me") {
    return ok(getCurrentMockAdmin(), config);
  }

  if (method === "get" && url === "/users") {
    const query = String(config.params?.q ?? "").toLowerCase();
    const results = query
      ? mockUsers.filter(
          (user) =>
            user.fullName.toLowerCase().includes(query) ||
            (user.email?.toLowerCase().includes(query) ?? false)
        )
      : mockUsers;
    return ok<AppUser[]>([...results], config);
  }

  const userMatch = url.match(/^\/users\/([^/]+)$/);
  if (userMatch && method === "get") {
    const user = mockUsers.find((candidate) => candidate.id === userMatch[1]);
    if (!user) return notFound(config);
    // TODO(backend): enforce this same role check server-side — a Support-role
    // request must never receive the kyc object (or an unmasked BVN) at all.
    const role = getCurrentMockAdmin().role;
    const scopedUser =
      role === "support" && user.kyc ? { ...user, kyc: null } : user;
    return ok(scopedUser, config);
  }
  if (userMatch && method === "patch") {
    const userId = userMatch[1];
    const { status, reason, note } = parseBody(config) as {
      status?: UserAccountStatus;
      reason?: SuspensionReason;
      note?: string;
    };
    const user = updateById(mockUsers, userId, status ? { status } : {});
    if (!user) return notFound(config);

    if (status === "suspended" || status === "active") {
      const admin = getCurrentMockAdmin();
      const entry: AuditEntry = {
        id: `audit-${Date.now()}`,
        userId,
        action: status === "suspended" ? "suspended" : "reactivated",
        reason,
        note,
        actingAdminName: admin.name,
        createdAt: new Date().toISOString(),
      };
      mockAuditTrail[userId] = [entry, ...(mockAuditTrail[userId] ?? [])];
    }

    return ok(user, config);
  }

  const auditTrailMatch = url.match(/^\/users\/([^/]+)\/audit-trail$/);
  if (auditTrailMatch && method === "get") {
    return ok<AuditEntry[]>(mockAuditTrail[auditTrailMatch[1]] ?? [], config);
  }

  const caseNotesMatch = url.match(/^\/users\/([^/]+)\/case-notes$/);
  if (caseNotesMatch && method === "get") {
    const notes = mockCaseNotes[caseNotesMatch[1]] ?? [];
    return ok<CaseNote[]>(notes, config);
  }
  if (caseNotesMatch && method === "post") {
    const userId = caseNotesMatch[1];
    const { body } = parseBody(config) as { body?: string };
    const admin = getCurrentMockAdmin();
    const note: CaseNote = {
      id: `note-${Date.now()}`,
      userId,
      authorId: admin.id,
      authorName: admin.name,
      body: body ?? "",
      createdAt: new Date().toISOString(),
    };
    mockCaseNotes[userId] = [note, ...(mockCaseNotes[userId] ?? [])];
    return ok(note, config);
  }

  if (method === "get" && url === "/admin-accounts") {
    return ok<AdminAccount[]>([...mockAdminAccounts], config);
  }

  if (method === "post" && url === "/admin-accounts") {
    const { email, role } = parseBody(config) as {
      email?: string;
      role?: AdminRole;
    };
    const resolvedRole = role ?? "support";
    const defaultAccessLevel: Record<AdminRole, AdminAccessLevel> = {
      support: "read_only",
      compliance: "limited",
      super_admin: "full",
    };
    const localPart = (email ?? "new.admin@beevia.dev").split("@")[0];
    const account: AdminAccount = {
      id: `admin-${Date.now()}`,
      name: localPart
        .split(/[._]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
      username: `@${localPart.replace(/[._]/g, "")}`,
      email: email ?? "new.admin@beevia.dev",
      role: resolvedRole,
      avatarColor: "bg-indigo-500",
      accessLevel: defaultAccessLevel[resolvedRole],
      status: "active",
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };
    mockAdminAccounts.unshift(account);
    return ok(account, config);
  }

  const adminAccountMatch = url.match(/^\/admin-accounts\/([^/]+)$/);
  if (adminAccountMatch && method === "patch") {
    const { role, status } = parseBody(config) as {
      role?: AdminRole;
      status?: AdminAccountStatus;
    };
    const account = updateById(mockAdminAccounts, adminAccountMatch[1], {
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
    });
    if (!account) return notFound(config);
    return ok(account, config);
  }

  return notFound(config);
};
