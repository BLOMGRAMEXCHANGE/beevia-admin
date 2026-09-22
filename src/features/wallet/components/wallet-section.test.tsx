import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { ReactNode } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WalletSection } from "@/features/wallet/components/wallet-section";

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

const EMPTY_USER = "user-empty-wallet";
const POPULATED_USER = "user-2";

const POPULATED_ROWS = Array.from({ length: 15 }, (_, i) => ({
  id: `wtx-${i}`,
  date: new Date(Date.now() - i * 3_600_000).toISOString(),
  type: i % 2 === 0 ? "transfer" : "withdrawal",
  direction: i % 2 === 0 ? "credit" : "debit",
  amount: "100.00",
  balance_after: `${100_000 - i * 100}.00`,
  status: "completed",
  reference: `ref-${i}`,
  description: "",
  currency: "NGN",
}));

function paginate<T>(rows: T[], page: number, limit: number) {
  const start = (page - 1) * limit;
  return rows.slice(start, start + limit);
}

const POPULATED_WALLET = {
  id: "wallet-1",
  user: { id: POPULATED_USER, name: "Test User" },
  currency: "NGN",
  balance: "19000.00",
  status: "active",
  provider: "anchor",
  vba: { account_number: "6850539275", bank_name: "PROVIDUS BANK" },
};

/** Fakes both endpoints the section talks to: `GET /admin/wallets/users/{id}`
 *  for the wallet record, and `GET /admin/transactions/users/{id}` for the
 *  ledger (respecting page/limit like the real one, so pagination is exercised). */
function mockWalletEndpoints({
  rowsByUser = {} as Record<string, typeof POPULATED_ROWS>,
  walletsByUser = {} as Record<string, (typeof POPULATED_WALLET)[]>,
}) {
  mockLiveClientGet.mockImplementation(
    (url: string, config?: { params: { page: number; limit: number } }) => {
      const userId = url.split("/").pop() as string;

      if (url.startsWith("/admin/wallets/users/")) {
        return Promise.resolve({
          data: {
            data: {
              user: { id: userId, name: "Test User" },
              wallets: walletsByUser[userId] ?? [],
            },
          },
        });
      }

      const rows = rowsByUser[userId] ?? [];
      const { page, limit } = config!.params;
      return Promise.resolve({
        data: {
          data: {
            user: { id: userId, name: "Test User" },
            transactions: paginate(rows, page, limit),
            pagination: {
              page,
              limit,
              total: rows.length,
              total_pages: Math.max(1, Math.ceil(rows.length / limit)),
            },
          },
        },
      });
    }
  );
}

describe("WalletSection", () => {
  test("renders the empty state when the user has no wallet or transactions", async () => {
    mockWalletEndpoints({ rowsByUser: { [EMPTY_USER]: [] } });
    render(<WalletSection userId={EMPTY_USER} />, { wrapper });

    expect(await screen.findByText("No transactions yet")).toBeInTheDocument();
    expect(
      await screen.findByText("This user has no wallet yet.")
    ).toBeInTheDocument();
  });

  test("renders transactions, the wallet record, and pagination for a populated user", async () => {
    mockWalletEndpoints({
      rowsByUser: { [POPULATED_USER]: POPULATED_ROWS },
      walletsByUser: { [POPULATED_USER]: [POPULATED_WALLET] },
    });
    render(<WalletSection userId={POPULATED_USER} />, { wrapper });

    // Balance comes from the wallet record, not the latest ledger row — note
    // the minor units, which the ledger-derived balance used to drop.
    expect(await screen.findByText("₦19,000.00")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("6850539275")).toBeInTheDocument();
    expect(screen.getByText("PROVIDUS BANK")).toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.getByRole("table").querySelectorAll("tbody tr").length
      ).toBe(10)
    );
    expect(screen.queryByText("No transactions yet")).not.toBeInTheDocument();

    // 10 per page over 15 rows → more than one page of pagination.
    expect(
      screen.getByRole("navigation", { name: /pagination/i })
    ).toBeInTheDocument();
  });

  test("shows the API's error message when the request fails", async () => {
    mockLiveClientGet.mockRejectedValue({
      isAxiosError: true,
      response: { status: 500, data: { message: "Ledger service is down." } },
    });
    render(<WalletSection userId={POPULATED_USER} />, { wrapper });

    expect(
      await screen.findByText("Ledger service is down.")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Wallet details could not be loaded.")
    ).toBeInTheDocument();
  });
});
