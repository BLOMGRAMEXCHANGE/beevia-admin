import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ActivityFeed } from "@/features/dashboard/components/activity-feed";
import { DashboardScenarioProvider } from "@/features/dashboard/capability";

const { mockLiveClientGet } = vi.hoisted(() => ({
  mockLiveClientGet: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  liveClient: { get: mockLiveClientGet },
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardScenarioProvider>{children}</DashboardScenarioProvider>
    </QueryClientProvider>
  );
}

afterEach(() => cleanup());
beforeEach(() => vi.clearAllMocks());

function activityResponse(items: unknown[]) {
  return { data: { data: { items, next_cursor: null } } };
}

const INVITE_ITEM = {
  id: "act-1",
  action: "admin_invited",
  module: "admin_accounts",
  actor: { admin_id: "admin-1", name: "Beevia Super Admin" },
  target: { entity_type: "admin", entity_id: "admin-2" },
  summary: "Invited Pudo (hello.promiseudo@gmail.com)",
  metadata: {},
  occurred_at: new Date(Date.now() - 60_000).toISOString(),
};

const USER_STATUS_ITEM = {
  id: "act-2",
  action: "user_status_changed",
  module: "users",
  actor: { admin_id: "admin-1", name: "Beevia Super Admin" },
  target: { entity_type: "user", entity_id: "user-9" },
  summary: "Suspended Marcus Bello",
  metadata: {},
  occurred_at: new Date(Date.now() - 120_000).toISOString(),
};

describe("ActivityFeed", () => {
  test("renders the backend's ready-made summary line and links to the target", async () => {
    mockLiveClientGet.mockResolvedValue(activityResponse([USER_STATUS_ITEM]));
    render(<ActivityFeed />, { wrapper });

    const link = await screen.findByRole("link", {
      name: /Suspended Marcus Bello/,
    });
    expect(link).toHaveAttribute("href", "/users/user-9");
  });

  test("an admin-target item links to /admin-accounts", async () => {
    mockLiveClientGet.mockResolvedValue(activityResponse([INVITE_ITEM]));
    render(<ActivityFeed />, { wrapper });

    const link = await screen.findByRole("link", { name: /Invited Pudo/ });
    expect(link).toHaveAttribute("href", "/admin-accounts");
  });

  test("empty result set shows the empty state, not a blank list", async () => {
    mockLiveClientGet.mockResolvedValue(activityResponse([]));
    render(<ActivityFeed />, { wrapper });

    expect(await screen.findByText("No recent activity")).toBeInTheDocument();
  });

  test("a failed fetch shows the error message with a retry action", async () => {
    mockLiveClientGet.mockRejectedValue({
      isAxiosError: true,
      response: { status: 500, data: { message: "Activity service is down." } },
    });
    render(<ActivityFeed />, { wrapper });

    expect(
      await screen.findByText("Activity service is down.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});
