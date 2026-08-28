import { describe, expect, test } from "vitest";
import {
  TRANSACTION_STATUSES_BY_TYPE,
  TRANSACTION_TYPE_DIRECTION,
} from "@/features/wallet/constants";
import {
  getMockWalletBalance,
  getMockWalletTransactions,
  hasEmptyWallet,
} from "@/features/wallet/mock-data";
import type { WalletTransactionType } from "@/features/wallet/types";

const POPULATED_USER = "user-2";

describe("getMockWalletTransactions", () => {
  test("returns a meaningful, paginatable set for a populated user", () => {
    const txns = getMockWalletTransactions(POPULATED_USER);
    expect(txns.length).toBeGreaterThanOrEqual(30);
    expect(txns.length).toBeLessThanOrEqual(45);
  });

  test("is deterministic across calls", () => {
    expect(getMockWalletTransactions(POPULATED_USER)).toEqual(
      getMockWalletTransactions(POPULATED_USER)
    );
  });

  test("covers all five transaction types", () => {
    const seen = new Set(
      getMockWalletTransactions(POPULATED_USER).map((txn) => txn.type)
    );
    (
      Object.keys(TRANSACTION_TYPE_DIRECTION) as WalletTransactionType[]
    ).forEach((type) => expect(seen.has(type)).toBe(true));
  });

  test("each transaction uses a status valid for its type", () => {
    for (const txn of getMockWalletTransactions(POPULATED_USER)) {
      expect(TRANSACTION_STATUSES_BY_TYPE[txn.type]).toContain(txn.status);
      expect(txn.direction).toBe(TRANSACTION_TYPE_DIRECTION[txn.type]);
      expect(txn.amount).toBeGreaterThan(0);
    }
  });

  test("spreads timestamps across a range of dates", () => {
    const days = new Set(
      getMockWalletTransactions(POPULATED_USER).map((txn) =>
        txn.timestamp.slice(0, 10)
      )
    );
    expect(days.size).toBeGreaterThan(10);
  });

  test("returns an empty set for a user flagged as having no wallet activity", () => {
    expect(hasEmptyWallet("user-empty-wallet")).toBe(true);
    expect(getMockWalletTransactions("user-empty-wallet")).toEqual([]);
    expect(getMockWalletBalance("user-empty-wallet")).toBe(0);
  });
});
