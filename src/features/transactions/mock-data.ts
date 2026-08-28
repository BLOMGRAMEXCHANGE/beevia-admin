import { MOCK_PEOPLE } from "@/features/pending-transfers/mock-data";
import {
  TRANSACTION_STATUSES_BY_TYPE,
  TRANSACTION_TYPE_DIRECTION,
} from "@/features/wallet/constants";
import type { WalletTransactionType } from "@/features/wallet/types";
import type { PlatformTransaction } from "@/features/transactions/types";

/**
 * MOCK DATA ONLY — stands in for a platform-wide `/admin/transactions` endpoint
 * that does not exist yet. `api.ts` is the single seam where a real endpoint
 * gets wired in.
 *
 * This reuses the per-user Wallet section's generation approach (seeded PRNG,
 * the same type/status/direction vocabulary) and simply spreads the output
 * across every mock user with a `user` field added per row. The dataset is
 * deterministic so it stays stable across re-renders, refetches, and tests.
 */

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32 — small, fast, seedable PRNG. */
function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

const AMOUNT_RANGE: Record<WalletTransactionType, [number, number]> = {
  wallet_funding_bank: [5_000, 500_000],
  wallet_funding_card: [1_000, 150_000],
  p2p_send: [500, 100_000],
  p2p_receive: [500, 100_000],
  external_transfer: [5_000, 800_000],
  card_spend: [500, 75_000],
};

const ALL_TYPES = Object.keys(AMOUNT_RANGE) as WalletTransactionType[];

const EXTERNAL_ACCOUNTS = [
  "GTBank ••4821 — A. Okafor",
  "Access Bank ••1907 — Personal",
  "Kuda ••6634 — Rent",
  "Zenith Bank ••2280 — Savings",
  "First Bank ••5512 — J. Adigun",
  "OPay ••3391 — Wallet",
];

const MERCHANTS = [
  "Jumia",
  "Spar Lekki",
  "Bolt",
  "Netflix",
  "DStv",
  "Shoprite",
  "Filmhouse Cinemas",
];

function counterpartyFor(
  type: WalletTransactionType,
  rng: () => number
): string {
  switch (type) {
    case "wallet_funding_bank":
      return "Bank Transfer";
    case "wallet_funding_card":
      return "Debit Card";
    case "p2p_send":
    case "p2p_receive":
      return pick(rng, MOCK_PEOPLE).name;
    case "external_transfer":
      return pick(rng, EXTERNAL_ACCOUNTS);
    case "card_spend":
      return pick(rng, MERCHANTS);
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

let cachedDataset: PlatformTransaction[] | null = null;

/**
 * The full platform-wide dataset: ~5–7 transactions for each of the 16 mock
 * users (≈ 80–110 rows), newest first. Built once and memoised.
 */
export function getMockPlatformTransactions(): PlatformTransaction[] {
  if (cachedDataset) return cachedDataset;

  const now = Date.now();
  const rows: PlatformTransaction[] = [];

  for (const user of MOCK_PEOPLE) {
    const rng = makeRng(hashString(`${user.id}:platform-transactions`));
    const count = randomInt(rng, 4, 8);

    for (let index = 0; index < count; index += 1) {
      const type = pick(rng, ALL_TYPES);
      const [min, max] = AMOUNT_RANGE[type];
      const amount = Math.round(randomInt(rng, min, max) / 100) * 100;
      const status = pick(rng, TRANSACTION_STATUSES_BY_TYPE[type]);
      const daysAgo = randomInt(rng, 0, 120) + rng();

      rows.push({
        id: `ptxn-${user.id}-${index}-${Math.floor(rng() * 1e6)}`,
        user,
        type,
        amount,
        direction: TRANSACTION_TYPE_DIRECTION[type],
        counterparty: counterpartyFor(type, rng),
        status,
        timestamp: new Date(now - daysAgo * DAY_MS).toISOString(),
      });
    }
  }

  cachedDataset = rows.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return cachedDataset;
}
