import { isAxiosError } from "axios";
import { liveClient } from "@/lib/api-client";
import { clearSession, setSession } from "@/lib/token-store";
import { mapAccessLevelToRole } from "@/lib/roles";
import type { AdminAccessLevel, CurrentAdmin } from "@/types/admin";

export interface FieldError {
  path: string;
  message: string;
}

export class AuthApiError extends Error {
  fieldErrors: FieldError[];

  constructor(message: string, fieldErrors: FieldError[] = []) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

interface LoginResponseData {
  access_token: string;
  admin: {
    id: string;
    full_name: string;
    email: string;
    role_id: string;
  };
}

interface RoleResponseData {
  id: string;
  name: string;
  access_level: AdminAccessLevel;
}

function toAuthApiError(error: unknown): AuthApiError {
  if (isAxiosError<{ message?: string; details?: FieldError[] }>(error)) {
    const message = error.response?.data?.message ?? "Something went wrong.";
    return new AuthApiError(message, error.response?.data?.details ?? []);
  }
  return new AuthApiError("Something went wrong.");
}

async function fetchRole(roleId: string): Promise<RoleResponseData> {
  const { data } = await liveClient.get<{ data: RoleResponseData }>(
    `/admin/roles/${roleId}`
  );
  return data.data;
}

export async function login(
  email: string,
  password: string
): Promise<CurrentAdmin> {
  try {
    const { data } = await liveClient.post<{ data: LoginResponseData }>(
      "/admin/auth/login",
      { email, password }
    );
    const { access_token, admin } = data.data;

    // Set the token before fetching the role so the request carries it.
    setSession(
      {
        id: admin.id,
        name: admin.full_name,
        email: admin.email,
        role: "support",
        roleId: admin.role_id,
      },
      access_token
    );

    const role = await fetchRole(admin.role_id);
    const currentAdmin: CurrentAdmin = {
      id: admin.id,
      name: admin.full_name,
      email: admin.email,
      role: mapAccessLevelToRole(role.access_level),
      roleId: role.id,
      roleName: role.name,
      accessLevel: role.access_level,
    };
    setSession(currentAdmin, access_token);
    return currentAdmin;
  } catch (error) {
    clearSession();
    throw toAuthApiError(error);
  }
}

export function logout() {
  clearSession();
}
