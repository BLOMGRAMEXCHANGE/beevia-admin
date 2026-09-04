import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserReconciliationCard } from "@/features/reconciliation/components/user-reconciliation-card";

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

const USER_ID = "c4cb3bd6-02db-4f20-b2ec-f089a2d7691e";

const DISCREPANCY_RESPONSE = {
  data: {
    data: {
      user: { id: USER_ID, name: "SAMUEL DAVID" },
      anchor_account_id: "178006586760255-anc_acc",
      status: "discrepancies",
      generated_at: new Date().toISOString(),
      summary: {
        matched: 3,
        amount_mismatch: 0,
        in_beevia_not_anchor: 0,
        in_anchor_not_beevia: 4,
        beevia_balance: "70006.00",
        anchor_balance: "0.00",
        balance_matches: false,
      },
      buckets: {
        amount_mismatch: [],
        in_beevia_not_anchor: [],
        in_anchor_not_beevia: [
          {
            anchor_txn_id: "17885215196724-anc_txn",
            kind: "payout",
            provider_ref: "17885215195152-anc_trsf",
            amount: "70090.00",
            direction: "debit",
            summary: "Transfer to Blomgram",
            date: "2026-09-04T11:32:00",
          },
        ],
      },
      notes: [
        "Deposits are correlated heuristically (amount + time); an unmatched deposit may be a real gap or a near-duplicate.",
      ],
    },
  },
};

const MATCHED_RESPONSE = {
  data: {
    data: {
      user: { id: USER_ID, name: "SAMUEL DAVID" },
      anchor_account_id: "178006586760255-anc_acc",
      status: "matched",
      generated_at: new Date().toISOString(),
      summary: {
        matched: 12,
        amount_mismatch: 0,
        in_beevia_not_anchor: 0,
        in_anchor_not_beevia: 0,
        beevia_balance: "70006.00",
        anchor_balance: "70006.00",
        balance_matches: true,
      },
      buckets: {
        amount_mismatch: [],
        in_beevia_not_anchor: [],
        in_anchor_not_beevia: [],
      },
      notes: [],
    },
  },
};

describe("UserReconciliationCard", () => {
  test("discrepancies: shows the status badge, counts, balances, and bucket rows", async () => {
    mockLiveClientGet.mockResolvedValue(DISCREPANCY_RESPONSE);
    render(<UserReconciliationCard userId={USER_ID} />, { wrapper });

    expect(await screen.findByText("Discrepancies")).toBeInTheDocument();
    expect(screen.getByText("Balances differ")).toBeInTheDocument();
    expect(screen.getByText("₦70,006")).toBeInTheDocument();
    expect(screen.getByText("Transfer to Blomgram")).toBeInTheDocument();
    // Only the non-empty bucket ("in_anchor_not_beevia") gets a rendered
    // table; "In Anchor, not Beevia" appears twice — the stat block label
    // and the table's own section header.
    expect(screen.getAllByText("In Anchor, not Beevia")).toHaveLength(2);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  test("matched: clean status, no bucket tables rendered", async () => {
    mockLiveClientGet.mockResolvedValue(MATCHED_RESPONSE);
    render(<UserReconciliationCard userId={USER_ID} />, { wrapper });

    // "Matched" appears both as the status badge and the stat block label.
    expect(
      (await screen.findAllByText("Matched")).length
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Balances match")).toBeInTheDocument();
    // Every bucket is empty, so no per-bucket table renders at all — the stat
    // blocks (which always render, with a 0 count) are the only place the
    // bucket labels show up.
    expect(screen.getAllByText("In Anchor, not Beevia")).toHaveLength(1);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  test("shows the API's error message with a retry action on failure", async () => {
    mockLiveClientGet.mockRejectedValue({
      isAxiosError: true,
      response: { status: 502, data: { message: "Anchor is unreachable." } },
    });
    render(<UserReconciliationCard userId={USER_ID} />, { wrapper });

    expect(
      await screen.findByText("Anchor is unreachable.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});
