import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReconciliationView } from "@/features/reconciliation/components/reconciliation-view";

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
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

afterEach(() => cleanup());
beforeEach(() => vi.clearAllMocks());

const POOL_RESPONSE = {
  data: {
    data: {
      status: "solvent",
      pool_account_id: "17719386815163-anc_acc",
      generated_at: new Date().toISOString(),
      ledger_liability: "2469993.00",
      pool_balance: "4058780.00",
      difference: "1588787.00",
      solvent: true,
      balance_matches: false,
      user_wallet_count: 4,
      notes: [
        "Pool holds more than the ledger owes users (surplus — org float or unattributed deposits).",
      ],
    },
  },
};

describe("ReconciliationView (pool)", () => {
  test("renders the solvency badge, balances, and note", async () => {
    mockLiveClientGet.mockResolvedValue(POOL_RESPONSE);
    render(<ReconciliationView />, { wrapper });

    expect(await screen.findByText("Solvent")).toBeInTheDocument();
    expect(screen.getByText("Balances differ")).toBeInTheDocument();
    expect(screen.getByText("₦2,469,993")).toBeInTheDocument();
    expect(screen.getByText("₦4,058,780")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(
      screen.getByText(/Pool holds more than the ledger owes users/)
    ).toBeInTheDocument();
  });

  test("shows the API's error message with a retry action on failure", async () => {
    mockLiveClientGet.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 500,
        data: { message: "Anchor pool check is unavailable." },
      },
    });
    render(<ReconciliationView />, { wrapper });

    expect(
      await screen.findByText("Anchor pool check is unavailable.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});
