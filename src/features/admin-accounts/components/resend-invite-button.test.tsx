import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ResendInviteButton } from "@/features/admin-accounts/components/resend-invite-button";
import type { AdminAccount } from "@/types/admin";

const { mockLiveClientPost, mockToastSuccess, mockToastError } = vi.hoisted(
  () => ({
    mockLiveClientPost: vi.fn(),
    mockToastSuccess: vi.fn(),
    mockToastError: vi.fn(),
  })
);

vi.mock("@/lib/api-client", () => ({
  liveClient: { post: mockLiveClientPost },
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

afterEach(() => cleanup());
beforeEach(() => vi.clearAllMocks());

const INVITED_ACCOUNT: AdminAccount = {
  id: "admin-9",
  fullName: "Jordan Blake",
  username: "jordan.blake",
  email: "jordan.blake@beevia.dev",
  avatarUrl: null,
  roleId: "role-1",
  roleName: "Support",
  accessLevel: "limited",
  status: "invited",
  lastActiveAt: new Date().toISOString(),
};

describe("ResendInviteButton", () => {
  test("posts to the resend endpoint and shows a success toast", async () => {
    mockLiveClientPost.mockResolvedValue({ data: {} });
    render(<ResendInviteButton account={INVITED_ACCOUNT} />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: /re-invite/i }));

    // Button flips to a confirmation state and disables to prevent a
    // double-send while the confirmation is showing.
    expect(await screen.findByRole("button", { name: "Sent" })).toBeDisabled();
    expect(mockLiveClientPost).toHaveBeenCalledWith(
      `/admin/accounts/${INVITED_ACCOUNT.id}/resend-invite`
    );
    expect(mockToastSuccess).toHaveBeenCalledWith(
      `Invitation resent to ${INVITED_ACCOUNT.email}.`
    );
  });

  test("shows the API's error message on failure", async () => {
    mockLiveClientPost.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 429,
        data: { message: "Please wait before resending." },
      },
    });
    render(<ResendInviteButton account={INVITED_ACCOUNT} />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: /re-invite/i }));

    await vi.waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "Please wait before resending."
      )
    );
    // Stays actionable after a failure — no lingering "Sending…" state.
    expect(
      await screen.findByRole("button", { name: /re-invite/i })
    ).not.toBeDisabled();
  });
});
