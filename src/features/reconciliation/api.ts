import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { liveClient } from "@/lib/api-client";
import type {
  PoolReconciliation,
  ReconciliationBucketKey,
  ReconciliationLineItem,
  UserReconciliation,
} from "@/features/reconciliation/types";

export class ReconciliationApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

function toReconciliationApiError(error: unknown): ReconciliationApiError {
  if (isAxiosError<{ message?: string }>(error)) {
    return new ReconciliationApiError(
      error.response?.data?.message ?? "Something went wrong.",
      error.response?.status
    );
  }
  return new ReconciliationApiError("Something went wrong.");
}

// ---------------------------------------------------------------------------
// Per-user reconciliation — GET /admin/reconciliation/users/{userId}
// ---------------------------------------------------------------------------

interface ReconciliationLineItemData {
  anchor_txn_id?: string;
  beevia_txn_id?: string;
  id?: string;
  kind?: string;
  provider_ref?: string;
  reference?: string;
  amount?: string;
  anchor_amount?: string;
  beevia_amount?: string;
  direction?: string;
  summary?: string;
  description?: string;
  date?: string;
}

interface UserReconciliationResponseData {
  data: {
    user: { id: string; name: string | null };
    anchor_account_id: string;
    status: string;
    generated_at: string;
    summary: {
      matched: number;
      amount_mismatch: number;
      in_beevia_not_anchor: number;
      in_anchor_not_beevia: number;
      beevia_balance: string;
      anchor_balance: string;
      balance_matches: boolean;
    };
    buckets: Record<ReconciliationBucketKey, ReconciliationLineItemData[]>;
    notes: string[];
  };
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function toLineItem(
  data: ReconciliationLineItemData,
  index: number
): ReconciliationLineItem {
  return {
    id: data.anchor_txn_id ?? data.beevia_txn_id ?? data.id ?? `row-${index}`,
    kind: data.kind ?? null,
    amount: toNumberOrNull(data.amount),
    anchorAmount: toNumberOrNull(data.anchor_amount),
    beeviaAmount: toNumberOrNull(data.beevia_amount),
    direction: data.direction ?? null,
    reference: data.provider_ref ?? data.reference ?? null,
    summary: data.summary ?? data.description ?? "",
    date: data.date ?? null,
  };
}

function toUserReconciliation(
  data: UserReconciliationResponseData["data"]
): UserReconciliation {
  return {
    user: data.user,
    anchorAccountId: data.anchor_account_id,
    status: data.status,
    generatedAt: data.generated_at,
    summary: {
      matched: data.summary.matched,
      amountMismatch: data.summary.amount_mismatch,
      inBeeviaNotAnchor: data.summary.in_beevia_not_anchor,
      inAnchorNotBeevia: data.summary.in_anchor_not_beevia,
      beeviaBalance: Number(data.summary.beevia_balance),
      anchorBalance: Number(data.summary.anchor_balance),
      balanceMatches: data.summary.balance_matches,
    },
    buckets: {
      amount_mismatch: (data.buckets.amount_mismatch ?? []).map(toLineItem),
      in_beevia_not_anchor: (data.buckets.in_beevia_not_anchor ?? []).map(
        toLineItem
      ),
      in_anchor_not_beevia: (data.buckets.in_anchor_not_beevia ?? []).map(
        toLineItem
      ),
    },
    notes: data.notes ?? [],
  };
}

export function useUserReconciliation(userId: string) {
  return useQuery({
    queryKey: ["reconciliation", "user", userId],
    queryFn: async () => {
      try {
        const { data } = await liveClient.get<UserReconciliationResponseData>(
          `/admin/reconciliation/users/${userId}`
        );
        return toUserReconciliation(data.data);
      } catch (error) {
        throw toReconciliationApiError(error);
      }
    },
    enabled: Boolean(userId),
    retry: false,
  });
}

// ---------------------------------------------------------------------------
// Pool reconciliation — GET /admin/reconciliation/pool
// ---------------------------------------------------------------------------

interface PoolReconciliationResponseData {
  data: {
    status: string;
    pool_account_id: string;
    generated_at: string;
    ledger_liability: string;
    pool_balance: string;
    difference: string;
    solvent: boolean;
    balance_matches: boolean;
    user_wallet_count: number;
    notes: string[];
  };
}

function toPoolReconciliation(
  data: PoolReconciliationResponseData["data"]
): PoolReconciliation {
  return {
    status: data.status,
    poolAccountId: data.pool_account_id,
    generatedAt: data.generated_at,
    ledgerLiability: Number(data.ledger_liability),
    poolBalance: Number(data.pool_balance),
    difference: Number(data.difference),
    solvent: data.solvent,
    balanceMatches: data.balance_matches,
    userWalletCount: data.user_wallet_count,
    notes: data.notes ?? [],
  };
}

export function usePoolReconciliation() {
  return useQuery({
    queryKey: ["reconciliation", "pool"],
    queryFn: async () => {
      try {
        const { data } = await liveClient.get<PoolReconciliationResponseData>(
          "/admin/reconciliation/pool"
        );
        return toPoolReconciliation(data.data);
      } catch (error) {
        throw toReconciliationApiError(error);
      }
    },
    retry: false,
  });
}
