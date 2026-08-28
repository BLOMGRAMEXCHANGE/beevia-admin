import type {
  PendingTransfer,
  PendingTransferKind,
  PendingTransferStatus,
  ResolutionMethod,
  TransferParty,
} from "@/features/pending-transfers/types";

/**
 * MOCK DATA ONLY — this module stands in for the pending-transfer service that
 * the banking sprint has not shipped yet. `api.ts` is the single seam where a
 * real endpoint would be wired in.
 *
 * Timestamps are expressed relative to when this module is evaluated (via
 * `createdHoursAgo` / `resolvedHoursAgo`) so that the "is this pending transfer
 * past its 24-hour window" question stays a real, live computation rather than
 * a fixed property of any given row.
 */

const PEOPLE: TransferParty[] = [
  {
    id: "user-101",
    name: "Adaeze Okoro",
    username: "@adaeze",
    phone: "+2348031234501",
  },
  {
    id: "user-102",
    name: "Tunde Balogun",
    username: "@tundeb",
    phone: "+2348031234502",
  },
  {
    id: "user-103",
    name: "Chidinma Eze",
    username: "@chidi_e",
    phone: "+2348031234503",
  },
  {
    id: "user-104",
    name: "Ibrahim Musa",
    username: "@ibmusa",
    phone: "+2348031234504",
  },
  {
    id: "user-105",
    name: "Ngozi Afolabi",
    username: "@ngoziaf",
    phone: "+2348031234505",
  },
  {
    id: "user-106",
    name: "Emeka Nwosu",
    username: "@emeka_n",
    phone: "+2348031234506",
  },
  {
    id: "user-107",
    name: "Fatima Bello",
    username: "@fatimab",
    phone: "+2348031234507",
  },
  {
    id: "user-108",
    name: "Yusuf Abubakar",
    username: "@yusufab",
    phone: "+2348031234508",
  },
  {
    id: "user-109",
    name: "Blessing Okonkwo",
    username: "@blessingo",
    phone: "+2348031234509",
  },
  {
    id: "user-110",
    name: "Segun Adeyemi",
    username: "@segun_a",
    phone: "+2348031234510",
  },
  {
    id: "user-111",
    name: "Halima Sani",
    username: "@halimas",
    phone: "+2348031234511",
  },
  {
    id: "user-112",
    name: "Obinna Chukwu",
    username: "@obinnac",
    phone: "+2348031234512",
  },
  {
    id: "user-113",
    name: "Aisha Lawal",
    username: "@aishal",
    phone: "+2348031234513",
  },
  {
    id: "user-114",
    name: "Kelechi Umeh",
    username: "@kelechiu",
    phone: "+2348031234514",
  },
  {
    id: "user-115",
    name: "Damilola Ojo",
    username: "@damilolao",
    phone: "+2348031234515",
  },
  {
    id: "user-116",
    name: "Suleiman Idris",
    username: "@suleimani",
    phone: "+2348031234516",
  },
];

/** Shared mock person pool, reused by the platform-wide All Transactions tab. */
export const MOCK_PEOPLE: TransferParty[] = PEOPLE;

function party(index: number): TransferParty {
  return PEOPLE[index % PEOPLE.length];
}

interface RawTransfer {
  reference: string;
  amount: number;
  kind: PendingTransferKind;
  senderIndex: number;
  recipientIndex: number;
  status: PendingTransferStatus;
  createdHoursAgo: number;
  /** Hours-ago the transfer resolved. Omitted for still-pending transfers. */
  resolvedHoursAgo?: number;
  resolutionMethod?: ResolutionMethod;
}

/**
 * 26 transfers covering the full spread the work order asks for:
 *  - 10 pending inside their 24h window (varying time remaining)
 *  - 3 pending past 24h with no resolution (the View 1 overdue cases)
 *  - 6 accepted, 4 declined, 3 auto-refunded
 */
const RAW_TRANSFERS: RawTransfer[] = [
  // --- pending, still inside the 24-hour window ---
  {
    reference: "TRF-8F2A19",
    amount: 15000,
    kind: "free_will_send",
    senderIndex: 0,
    recipientIndex: 1,
    status: "pending",
    createdHoursAgo: 0.4,
  },
  {
    reference: "TRF-3C71B0",
    amount: 4200,
    kind: "free_will_send",
    senderIndex: 2,
    recipientIndex: 3,
    status: "pending",
    createdHoursAgo: 1.5,
  },
  {
    reference: "TRF-9D40E2",
    amount: 87500,
    kind: "mismatched_fulfillment",
    senderIndex: 4,
    recipientIndex: 5,
    status: "pending",
    createdHoursAgo: 3,
  },
  {
    reference: "TRF-1A55C7",
    amount: 22000,
    kind: "free_will_send",
    senderIndex: 6,
    recipientIndex: 7,
    status: "pending",
    createdHoursAgo: 6,
  },
  {
    reference: "TRF-6E2F84",
    amount: 130000,
    kind: "mismatched_fulfillment",
    senderIndex: 8,
    recipientIndex: 9,
    status: "pending",
    createdHoursAgo: 9,
  },
  {
    reference: "TRF-4B90A3",
    amount: 5500,
    kind: "free_will_send",
    senderIndex: 10,
    recipientIndex: 11,
    status: "pending",
    createdHoursAgo: 12,
  },
  {
    reference: "TRF-2F18D6",
    amount: 46000,
    kind: "free_will_send",
    senderIndex: 12,
    recipientIndex: 13,
    status: "pending",
    createdHoursAgo: 15,
  },
  {
    reference: "TRF-7C3E51",
    amount: 300000,
    kind: "mismatched_fulfillment",
    senderIndex: 14,
    recipientIndex: 15,
    status: "pending",
    createdHoursAgo: 19,
  },
  {
    reference: "TRF-5A8B22",
    amount: 9800,
    kind: "free_will_send",
    senderIndex: 1,
    recipientIndex: 4,
    status: "pending",
    createdHoursAgo: 21.5,
  },
  {
    reference: "TRF-0D6C93",
    amount: 64000,
    kind: "mismatched_fulfillment",
    senderIndex: 3,
    recipientIndex: 6,
    status: "pending",
    createdHoursAgo: 23.4,
  },

  // --- pending, PAST the 24-hour window (must surface in View 1 by default) ---
  {
    reference: "TRF-B1F7E0",
    amount: 52000,
    kind: "free_will_send",
    senderIndex: 5,
    recipientIndex: 8,
    status: "pending",
    createdHoursAgo: 26.5,
  },
  {
    reference: "TRF-C9A203",
    amount: 175000,
    kind: "mismatched_fulfillment",
    senderIndex: 7,
    recipientIndex: 10,
    status: "pending",
    createdHoursAgo: 31,
  },
  {
    reference: "TRF-E4D8F1",
    amount: 8300,
    kind: "free_will_send",
    senderIndex: 9,
    recipientIndex: 12,
    status: "pending",
    createdHoursAgo: 49,
  },

  // --- accepted by the recipient ---
  {
    reference: "TRF-A73C10",
    amount: 25000,
    kind: "free_will_send",
    senderIndex: 11,
    recipientIndex: 14,
    status: "accepted",
    createdHoursAgo: 30,
    resolvedHoursAgo: 22,
    resolutionMethod: "accepted_by_recipient",
  },
  {
    reference: "TRF-F02E9B",
    amount: 112000,
    kind: "mismatched_fulfillment",
    senderIndex: 13,
    recipientIndex: 0,
    status: "accepted",
    createdHoursAgo: 44,
    resolvedHoursAgo: 40,
    resolutionMethod: "accepted_by_recipient",
  },
  {
    reference: "TRF-3B6D47",
    amount: 7600,
    kind: "free_will_send",
    senderIndex: 15,
    recipientIndex: 2,
    status: "accepted",
    createdHoursAgo: 52,
    resolvedHoursAgo: 50,
    resolutionMethod: "accepted_by_recipient",
  },
  {
    reference: "TRF-8E1A05",
    amount: 240000,
    kind: "mismatched_fulfillment",
    senderIndex: 2,
    recipientIndex: 5,
    status: "accepted",
    createdHoursAgo: 70,
    resolvedHoursAgo: 55,
    resolutionMethod: "accepted_by_recipient",
  },
  {
    reference: "TRF-5C9F38",
    amount: 19000,
    kind: "free_will_send",
    senderIndex: 4,
    recipientIndex: 7,
    status: "accepted",
    createdHoursAgo: 96,
    resolvedHoursAgo: 90,
    resolutionMethod: "accepted_by_recipient",
  },
  {
    reference: "TRF-1D7B60",
    amount: 43500,
    kind: "free_will_send",
    senderIndex: 6,
    recipientIndex: 9,
    status: "accepted",
    createdHoursAgo: 140,
    resolvedHoursAgo: 122,
    resolutionMethod: "accepted_by_recipient",
  },

  // --- declined by the recipient ---
  {
    reference: "TRF-9A2C74",
    amount: 60000,
    kind: "mismatched_fulfillment",
    senderIndex: 8,
    recipientIndex: 11,
    status: "declined",
    createdHoursAgo: 33,
    resolvedHoursAgo: 30,
    resolutionMethod: "declined_by_recipient",
  },
  {
    reference: "TRF-4F8E21",
    amount: 3400,
    kind: "free_will_send",
    senderIndex: 10,
    recipientIndex: 13,
    status: "declined",
    createdHoursAgo: 48,
    resolvedHoursAgo: 41,
    resolutionMethod: "declined_by_recipient",
  },
  {
    reference: "TRF-7B3D09",
    amount: 210000,
    kind: "mismatched_fulfillment",
    senderIndex: 12,
    recipientIndex: 15,
    status: "declined",
    createdHoursAgo: 66,
    resolvedHoursAgo: 47,
    resolutionMethod: "declined_by_recipient",
  },
  {
    reference: "TRF-2E5A96",
    amount: 12750,
    kind: "free_will_send",
    senderIndex: 14,
    recipientIndex: 1,
    status: "declined",
    createdHoursAgo: 120,
    resolvedHoursAgo: 103,
    resolutionMethod: "declined_by_recipient",
  },

  // --- auto-refunded after the 24-hour timeout (no recipient action) ---
  {
    reference: "TRF-6D1F82",
    amount: 95000,
    kind: "mismatched_fulfillment",
    senderIndex: 0,
    recipientIndex: 3,
    status: "auto_refunded",
    createdHoursAgo: 58,
    resolvedHoursAgo: 34,
    resolutionMethod: "auto_refunded_timeout",
  },
  {
    reference: "TRF-0A9C47",
    amount: 27000,
    kind: "free_will_send",
    senderIndex: 5,
    recipientIndex: 12,
    status: "auto_refunded",
    createdHoursAgo: 90,
    resolvedHoursAgo: 66,
    resolutionMethod: "auto_refunded_timeout",
  },
  {
    reference: "TRF-B8E350",
    amount: 6100,
    kind: "free_will_send",
    senderIndex: 9,
    recipientIndex: 6,
    status: "auto_refunded",
    createdHoursAgo: 150,
    resolvedHoursAgo: 126,
    resolutionMethod: "auto_refunded_timeout",
  },
];

function hoursAgoToIso(hours: number, base: number): string {
  return new Date(base - hours * 60 * 60 * 1000).toISOString();
}

/**
 * Builds the dataset relative to a base time (defaults to now). The base is
 * captured once per call so every row in a single fetch shares a consistent
 * "now".
 */
export function buildMockTransfers(
  base: number = Date.now()
): PendingTransfer[] {
  return RAW_TRANSFERS.map((raw) => ({
    reference: raw.reference,
    amount: raw.amount,
    kind: raw.kind,
    sender: party(raw.senderIndex),
    recipient: party(raw.recipientIndex),
    status: raw.status,
    createdAt: hoursAgoToIso(raw.createdHoursAgo, base),
    resolvedAt:
      raw.resolvedHoursAgo !== undefined
        ? hoursAgoToIso(raw.resolvedHoursAgo, base)
        : null,
    resolutionMethod: raw.resolutionMethod ?? null,
  }));
}
