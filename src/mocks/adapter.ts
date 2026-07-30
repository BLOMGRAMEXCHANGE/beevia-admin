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
import type { AppUser, CaseNote, UserAccountStatus } from "@/types/user";
import {
  findDemoAccountByEmail,
  getCurrentMockAdmin,
  mockAdminAccounts,
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
            user.email.toLowerCase().includes(query)
        )
      : mockUsers;
    return ok<AppUser[]>([...results], config);
  }

  const userMatch = url.match(/^\/users\/([^/]+)$/);
  if (userMatch && method === "get") {
    const user = mockUsers.find((candidate) => candidate.id === userMatch[1]);
    if (!user) return notFound(config);
    return ok(user, config);
  }
  if (userMatch && method === "patch") {
    const { status } = parseBody(config) as { status?: UserAccountStatus };
    const user = updateById(mockUsers, userMatch[1], status ? { status } : {});
    if (!user) return notFound(config);
    return ok(user, config);
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
