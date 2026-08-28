import { AxiosError, AxiosHeaders } from "axios";
import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import type { AdminRole } from "@/types/admin";
import type { AuditEntry } from "@/types/user";
import {
  findDemoAccountByEmail,
  getCurrentMockAdmin,
  mockAuditTrail,
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

  const auditTrailMatch = url.match(/^\/users\/([^/]+)\/audit-trail$/);
  if (auditTrailMatch && method === "get") {
    return ok<AuditEntry[]>(mockAuditTrail[auditTrailMatch[1]] ?? [], config);
  }

  return notFound(config);
};
