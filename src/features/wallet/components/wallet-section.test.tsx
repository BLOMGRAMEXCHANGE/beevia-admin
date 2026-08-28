import { afterEach, describe, expect, test } from "vitest";
import type { ReactNode } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WalletSection } from "@/features/wallet/components/wallet-section";
import {
  getMockWalletTransactions,
  hasEmptyWallet,
} from "@/features/wallet/mock-data";

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

afterEach(() => cleanup());

const EMPTY_USER = "user-empty-wallet";
const POPULATED_USER = "user-2";

describe("WalletSection", () => {
  test("fixture sanity: the two users under test are actually empty / populated", () => {
    expect(hasEmptyWallet(EMPTY_USER)).toBe(true);
    expect(getMockWalletTransactions(EMPTY_USER)).toHaveLength(0);
    expect(hasEmptyWallet(POPULATED_USER)).toBe(false);
    expect(getMockWalletTransactions(POPULATED_USER).length).toBeGreaterThan(0);
  });

  test("renders the empty state when the user has no transactions", async () => {
    render(<WalletSection userId={EMPTY_USER} />, { wrapper });

    expect(await screen.findByText("No transactions yet")).toBeInTheDocument();
    // Balance still resolves — to zero.
    expect(await screen.findByText("₦0")).toBeInTheDocument();
  });

  test("renders transactions and pagination for a populated user", async () => {
    render(<WalletSection userId={POPULATED_USER} />, { wrapper });

    // Table fills in once the mocked fetch resolves.
    await waitFor(
      () =>
        expect(
          screen.getByRole("table").querySelectorAll("tbody tr").length
        ).toBe(10),
      { timeout: 8000 }
    );
    expect(screen.queryByText("No transactions yet")).not.toBeInTheDocument();

    // 10 per page over 30+ rows → more than one page of pagination.
    expect(
      screen.getByRole("navigation", { name: /pagination/i })
    ).toBeInTheDocument();
  }, 15000);
});
