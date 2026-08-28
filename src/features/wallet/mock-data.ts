import {
  SETTLED_STATUSES,
  TRANSACTION_STATUSES_BY_TYPE,
  TRANSACTION_TYPE_DIRECTION,
} from "@/features/wallet/constants";
import type {
  WalletTransaction,
  WalletTransactionType,
} from "@/features/wallet/types";

/**
 * MOCK DATA ONLY — this entire module stands in for a wallet API that does not
 * exist yet. `api.ts` is the single seam where a real endpoint gets wired in.
 *
 * The dataset for a given user id is deterministic (seeded off the id) so it
 * stays stable across re-renders, refetches, and test runs.
 */

const NAIRA = 1;

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

const PEOPLE = [
  "Adaeze Okoro",
  "Tunde Balogun",
  "Chidinma Eze",
  "Ibrahim Musa",
  "Ngozi Afolabi",
  "Emeka Nwosu",
  "Fatima Bello",
  "Yusuf Abubakar",
  "Blessing Okonkwo",
  "Segun Adeyemi",
  "Hauwa Sani",
  "Kelechi Obi",
];

const EXTERNAL_ACCOUNTS = [
  "GTBank ••4821 — A. Okafor",
  "Access Bank ••1907 — Personal",
  "Kuda ••6634 — Rent",
  "Zenith Bank ••2280 — Savings",
  "First Bank ••5512 — J. Adigun",
  "OPay ••3391 — Wallet",
];

/** Naira amount ranges that read as realistic for each transaction type. */
const AMOUNT_RANGE: Record<WalletTransactionType, [number, number]> = {
  wallet_funding_bank: [5_000 * NAIRA, 500_000 * NAIRA],
  wallet_funding_card: [1_000 * NAIRA, 150_000 * NAIRA],
  p2p_send: [500 * NAIRA, 100_000 * NAIRA],
  p2p_receive: [500 * NAIRA, 100_000 * NAIRA],
  external_transfer: [5_000 * NAIRA, 800_000 * NAIRA],
  card_spend: [500 * NAIRA, 75_000 * NAIRA],
};

const ALL_TYPES = Object.keys(AMOUNT_RANGE) as WalletTransactionType[];

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
      return pick(rng, PEOPLE);
    case "external_transfer":
      return pick(rng, EXTERNAL_ACCOUNTS);
    case "card_spend":
      // Placeholder: merchant-level detail (name, category, MID) isn't spec'd
      // for this project yet.
      return "Merchant Payment";
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * User ids that should present as brand-new wallets with zero transactions, so
 * the empty state is exercised. Any id also lands here if its hash is divisible
 * by 11, which keeps a slice of the real user list covering the empty case.
 */
export const EXPLICIT_EMPTY_WALLET_USER_IDS = new Set<string>([
  "user-empty-wallet",
]);

export function hasEmptyWallet(userId: string): boolean {
  if (EXPLICIT_EMPTY_WALLET_USER_IDS.has(userId)) return true;
  return hashString(`${userId}:wallet`) % 11 === 0;
}

export function getMockWalletTransactions(userId: string): WalletTransaction[] {
  if (hasEmptyWallet(userId)) return [];

  const seed = hashString(`${userId}:transactions`);
  const rng = makeRng(seed);
  const count = randomInt(rng, 32, 41);
  const now = Date.now();

  const transactions: WalletTransaction[] = Array.from({ length: count }).map(
    (_, index) => {
      const type = pick(rng, ALL_TYPES);
      const [min, max] = AMOUNT_RANGE[type];
      const amount = Math.round(randomInt(rng, min, max) / 100) * 100;
      const status = pick(rng, TRANSACTION_STATUSES_BY_TYPE[type]);

      // Spread across roughly the last four months, jittered so no two land on
      // the same instant and the ordering isn't a clean sequence.
      const daysAgo = randomInt(rng, 0, 118) + rng();
      const timestamp = new Date(now - daysAgo * DAY_MS).toISOString();

      return {
        id: `txn-${userId}-${index}-${Math.floor(rng() * 1e6)}`,
        type,
        amount,
        direction: TRANSACTION_TYPE_DIRECTION[type],
        counterparty: counterpartyFor(type, rng),
        status,
        timestamp,
      };
    }
  );

  return transactions.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function getMockWalletBalance(userId: string): number {
  if (hasEmptyWallet(userId)) return 0;

  // Net of settled movements, floored at zero, with a seeded opening balance so
  // the number stays plausible even for users whose settled debits dominate.
  const opening = randomInt(
    makeRng(hashString(`${userId}:opening`)),
    0,
    250_000
  );
  const net = getMockWalletTransactions(userId)
    .filter((txn) => SETTLED_STATUSES.includes(txn.status))
    .reduce(
      (sum, txn) =>
        sum + (txn.direction === "credit" ? txn.amount : -txn.amount),
      opening
    );

  return Math.max(0, Math.round(net));
}
