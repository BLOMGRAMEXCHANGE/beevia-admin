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

/** Fake `GET /admin/transactions/users/{userId}` — respects page/limit like the
 *  real endpoint, so both the balance call (limit 1) and the history call
 *  (limit 10) get correctly shaped, correctly paginated responses. */
function mockLedgerEndpoint(rowsByUser: Record<string, typeof POPULATED_ROWS>) {
  mockLiveClientGet.mockImplementation(
    (url: string, config: { params: { page: number; limit: number } }) => {
      const userId = url.split("/").pop() as string;
      const rows = rowsByUser[userId] ?? [];
      const { page, limit } = config.params;
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
  test("renders the empty state when the user has no transactions", async () => {
    mockLedgerEndpoint({ [EMPTY_USER]: [] });
    render(<WalletSection userId={EMPTY_USER} />, { wrapper });

    expect(await screen.findByText("No transactions yet")).toBeInTheDocument();
    // Balance still resolves — to zero, since there's no most-recent row.
    expect(await screen.findByText("₦0")).toBeInTheDocument();
  });

  test("renders transactions, the real balance, and pagination for a populated user", async () => {
    mockLedgerEndpoint({ [POPULATED_USER]: POPULATED_ROWS });
    render(<WalletSection userId={POPULATED_USER} />, { wrapper });

    // Balance = balance_after of the most recent (first) row.
    expect(await screen.findByText("₦100,000")).toBeInTheDocument();

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
  });
});
