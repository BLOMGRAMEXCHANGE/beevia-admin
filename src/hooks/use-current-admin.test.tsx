import { describe, expect, test, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCurrentAdmin } from "@/hooks/use-current-admin";
import type { CurrentAdmin } from "@/types/admin";

const { mockGetStoredAdmin, mockLiveClientGet } = vi.hoisted(() => ({
  mockGetStoredAdmin: vi.fn(),
  mockLiveClientGet: vi.fn(),
}));

vi.mock("@/lib/token-store", () => ({
  getStoredAdmin: mockGetStoredAdmin,
}));

vi.mock("@/lib/api-client", () => ({
  liveClient: { get: mockLiveClientGet },
}));

const STORED_ADMIN: CurrentAdmin = {
  id: "admin-1",
  name: "Jane Doe",
  email: "jane@example.com",
  role: "compliance",
  roleId: "role-1",
  roleName: "Compliance Reviewer",
  accessLevel: "limited",
};

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCurrentAdmin", () => {
  test("merges partial role permissions and reports false for unset actions/modules", async () => {
    mockGetStoredAdmin.mockReturnValue(STORED_ADMIN);
    mockLiveClientGet.mockResolvedValue({
      data: {
        data: {
          id: "role-1",
          name: "Compliance Reviewer",
          description: "",
          type: "custom",
          status: "active",
          assigned_admin_count: 1,
          access_level: "limited",
          updated_at: "2026-01-01T00:00:00Z",
          assigned_admin_ids: ["admin-1"],
          permissions: [
            {
              module: "kyc",
              can_view: true,
              can_create: false,
              can_edit: false,
              can_delete: false,
              can_approve: true,
              can_export: false,
              can_manage: false,
            },
          ],
        },
      },
    });

    const { result } = renderHook(() => useCurrentAdmin(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Set permission on a partially-permissioned module.
    expect(result.current.hasPermission("kyc", "canView")).toBe(true);
    expect(result.current.hasPermission("kyc", "canApprove")).toBe(true);
    // Unset action within that same module.
    expect(result.current.hasPermission("kyc", "canDelete")).toBe(false);
    // A module the role has no permissions entry for at all.
    expect(result.current.hasPermission("users", "canView")).toBe(false);
    expect(result.current.hasPermission("admin_accounts", "canManage")).toBe(
      false
    );

    expect(result.current.data?.id).toBe("admin-1");
    expect(result.current.permissions?.kyc.canView).toBe(true);
    expect(result.current.permissions?.users.canView).toBe(false);
  });

  test("fails closed while permissions are still loading", async () => {
    mockGetStoredAdmin.mockReturnValue(STORED_ADMIN);
    let resolveRole: (value: unknown) => void = () => {};
    mockLiveClientGet.mockReturnValue(
      new Promise((resolve) => {
        resolveRole = resolve;
      })
    );

    const { result } = renderHook(() => useCurrentAdmin(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.hasPermission("kyc", "canView")).toBe(false);
    expect(result.current.permissions).toBeNull();

    resolveRole({
      data: {
        data: {
          id: "role-1",
          name: "Compliance Reviewer",
          description: "",
          type: "custom",
          status: "active",
          assigned_admin_count: 1,
          access_level: "limited",
          updated_at: "2026-01-01T00:00:00Z",
          assigned_admin_ids: ["admin-1"],
          permissions: [],
        },
      },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  test("fails closed and keeps identity usable if the permissions fetch errors", async () => {
    mockGetStoredAdmin.mockReturnValue(STORED_ADMIN);
    mockLiveClientGet.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useCurrentAdmin(), { wrapper });

    await waitFor(() => expect(result.current.isPermissionsError).toBe(true));

    expect(result.current.hasPermission("kyc", "canView")).toBe(false);
    expect(result.current.permissions).toBeNull();
    // Identity itself should still be usable.
    expect(result.current.data?.id).toBe("admin-1");
    expect(result.current.data?.name).toBe("Jane Doe");
  });

  test("fails closed when there is no signed-in admin at all", async () => {
    mockGetStoredAdmin.mockReturnValue(null);

    const { result } = renderHook(() => useCurrentAdmin(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeUndefined();
    expect(result.current.permissions).toBeNull();
    expect(result.current.hasPermission("kyc", "canView")).toBe(false);
  });
});
