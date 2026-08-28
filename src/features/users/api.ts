import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { liveClient, apiClient } from "@/lib/api-client";
import { triggerBlobDownload } from "@/lib/csv";
import type {
  AccountType,
  AuditEntry,
  CaseNote,
  RecentSearches,
  UserAccountStatus,
  UserActionHistoryEntry,
  UserRecord,
  UsersListPagination,
  VerificationCheck,
  VerificationDetail,
  VerificationStatus,
  WalletStatus,
} from "@/types/user";
import type { CaseNoteCategory } from "@/features/users/case-note-categories";

export class UserApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

function toUserApiError(error: unknown): UserApiError {
  if (isAxiosError<{ message?: string }>(error)) {
    return new UserApiError(
      error.response?.data?.message ?? "Something went wrong.",
      error.response?.status
    );
  }
  return new UserApiError("Something went wrong.");
}

interface UserRecordData {
  id: string;
  display_name: string | null;
  username: string;
  email: string | null;
  phone: string;
  country_code: string;
  avatar_url: string | null;
  account_type: AccountType;
  verification: VerificationStatus;
  wallet: WalletStatus;
  status: UserAccountStatus;
  joined_at: string;
  last_active_at: string | null;
}

function toUserRecord(data: UserRecordData): UserRecord {
  return {
    id: data.id,
    fullName: data.display_name,
    username: data.username,
    email: data.email,
    phone: data.phone,
    country: data.country_code,
    avatarUrl: data.avatar_url,
    accountType: data.account_type,
    verification: data.verification,
    wallet: data.wallet,
    status: data.status,
    joinedAt: data.joined_at,
    lastActiveAt: data.last_active_at,
  };
}

export interface UsersFilters {
  search?: string;
  country?: string;
  accountType?: AccountType;
  accountStatus?: UserAccountStatus;
  verification?: VerificationStatus;
  wallet?: WalletStatus;
  joinedFrom?: string;
  joinedTo?: string;
}

interface UsersListResponseData {
  data: {
    items: UserRecordData[];
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export function useUsersList(
  filters: UsersFilters,
  page: number,
  limit: number
) {
  return useQuery({
    queryKey: ["users", "list", filters, page, limit],
    queryFn: async () => {
      try {
        const { data } = await liveClient.get<UsersListResponseData>(
          "/admin/users",
          { params: { ...filters, page, limit } }
        );
        const pagination: UsersListPagination = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.total,
          totalPages: data.data.total_pages,
        };
        return { users: data.data.items.map(toUserRecord), pagination };
      } catch (error) {
        throw toUserApiError(error);
      }
    },
    placeholderData: keepPreviousData,
  });
}

export function useUserDetail(userId: string) {
  return useQuery({
    queryKey: ["users", "detail", userId],
    queryFn: async () => {
      try {
        const { data } = await liveClient.get<{ data: UserRecordData }>(
          `/admin/users/${userId}`
        );
        return toUserRecord(data.data);
      } catch (error) {
        throw toUserApiError(error);
      }
    },
    enabled: Boolean(userId),
    retry: false,
  });
}

function contentDispositionFilename(headerValue: unknown): string | null {
  if (typeof headerValue !== "string") return null;
  const match = headerValue.match(/filename="?([^";]+)"?/i);
  return match ? match[1] : null;
}

export function useExportUsers() {
  return useMutation({
    mutationFn: async (filters: UsersFilters) => {
      try {
        const response = await liveClient.get("/admin/users/export", {
          params: filters,
          responseType: "blob",
        });
        const filename =
          contentDispositionFilename(response.headers["content-disposition"]) ??
          "beevia-users-export.csv";
        triggerBlobDownload(response.data, filename);
      } catch (error) {
        throw toUserApiError(error);
      }
    },
  });
}

interface RecentSearchesResponseData {
  data: {
    terms: string[];
    users: {
      id: string;
      display_name: string | null;
      username: string;
      avatar_url: string | null;
    }[];
  };
}

export function useRecentSearches() {
  return useQuery({
    queryKey: ["users", "recent-searches"],
    queryFn: async () => {
      try {
        const { data } = await liveClient.get<RecentSearchesResponseData>(
          "/admin/users/recent-searches"
        );
        const result: RecentSearches = {
          terms: data.data.terms,
          users: data.data.users.map((user) => ({
            id: user.id,
            fullName: user.display_name,
            username: user.username,
            avatarUrl: user.avatar_url,
          })),
        };
        return result;
      } catch (error) {
        throw toUserApiError(error);
      }
    },
  });
}

export function useRecordSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (term: string) => {
      // Response shape isn't confirmed, so it's ignored — the recent-searches
      // query is invalidated instead and refetched from the server.
      await liveClient.post("/admin/users/recent-searches", { term });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "recent-searches"] });
    },
  });
}

// The audit trail has no confirmed endpoint yet in this module's contract,

export function useUserAuditTrail(userId: string) {
  return useQuery({
    queryKey: ["users", userId, "audit-trail"],
    queryFn: async () => {
      const { data } = await apiClient.get<AuditEntry[]>(
        `/users/${userId}/audit-trail`
      );
      return data;
    },
    enabled: Boolean(userId),
  });
}

interface CaseNoteData {
  id: string;
  category: string;
  body: string;
  author: { id: string; full_name: string } | null;
  created_at: string;
}

function toCaseNote(data: CaseNoteData): CaseNote {
  return {
    id: data.id,
    category: data.category,
    body: data.body,
    authorFullName: data.author?.full_name ?? "Unknown",
    createdAt: data.created_at,
  };
}

export function useCaseNotes(userId: string) {
  return useQuery({
    queryKey: ["users", userId, "case-notes"],
    queryFn: async () => {
      try {
        const { data } = await liveClient.get<{ data: CaseNoteData[] }>(
          `/admin/users/${userId}/case-notes`
        );
        return data.data.map(toCaseNote);
      } catch (error) {
        throw toUserApiError(error);
      }
    },
    enabled: Boolean(userId),
  });
}

export function useAddCaseNote(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { category: CaseNoteCategory; body: string }) => {
      try {
        const { data } = await liveClient.post<{ data: CaseNoteData[] }>(
          `/admin/users/${userId}/case-notes`,
          input
        );
        return data.data.map(toCaseNote);
      } catch (error) {
        throw toUserApiError(error);
      }
    },
    onSuccess: (notes) => {
      queryClient.setQueryData(["users", userId, "case-notes"], notes);
      queryClient.invalidateQueries({
        queryKey: ["users", userId, "case-notes"],
      });
    },
  });
}

interface VerificationCheckData {
  type: string;
  status: string;
  provider: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  failed_attempts: number;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  value: string | null;
}

interface VerificationDetailData {
  kyc_level: string;
  checks_passed: number;
  checks_total: number;
  outstanding_checks: string[];
  checks: VerificationCheckData[];
}

function toVerificationCheck(
  data: Partial<VerificationCheckData>
): VerificationCheck {
  return {
    type: data.type ?? "unknown",
    status: data.status ?? "unknown",
    provider: data.provider ?? null,
    submittedAt: data.submitted_at ?? null,
    approvedAt: data.approved_at ?? null,
    failedAttempts: data.failed_attempts ?? 0,
    reviewedBy: data.reviewed_by ?? null,
    reviewedAt: data.reviewed_at ?? null,
    reviewNote: data.review_note ?? null,
    maskedValue: data.value ?? null,
  };
}

function toVerificationDetail(
  data: Partial<VerificationDetailData>
): VerificationDetail {
  return {
    kycLevel: data.kyc_level ?? "",
    checksPassed: data.checks_passed ?? 0,
    checksTotal: data.checks_total ?? 0,
    outstandingChecks: data.outstanding_checks ?? [],
    checks: (data.checks ?? []).map(toVerificationCheck),
  };
}

export function useVerificationDetail(userId: string) {
  return useQuery({
    queryKey: ["users", userId, "verification"],
    queryFn: async () => {
      try {
        const { data } = await liveClient.get<{
          data: Partial<VerificationDetailData>;
        }>(`/admin/users/${userId}/verification`);
        return toVerificationDetail(data.data ?? {});
      } catch (error) {
        throw toUserApiError(error);
      }
    },
    enabled: Boolean(userId),
    retry: false,
  });
}

interface UserActionHistoryData {
  id: string;
  admin_id: string;
  action: string;
  reason: string | null;
  note: string | null;
  previous_status: string;
  new_status: string;
  created_at: string;
}

function toUserActionHistoryEntry(
  data: Partial<UserActionHistoryData>
): UserActionHistoryEntry {
  return {
    id: data.id ?? "",
    adminId: data.admin_id ?? "",
    actionType: data.action ?? "unknown",
    reason: data.reason ?? null,
    note: data.note ?? null,
    previousStatus: data.previous_status ?? "unknown",
    newStatus: data.new_status ?? "unknown",
    createdAt: data.created_at ?? new Date(0).toISOString(),
  };
}

export function useUserActionHistory(userId: string) {
  return useQuery({
    queryKey: ["users", userId, "actions"],
    queryFn: async () => {
      try {
        const { data } = await liveClient.get<{
          data: Partial<UserActionHistoryData>[];
        }>(`/admin/users/${userId}/actions`);
        return (data.data ?? []).map(toUserActionHistoryEntry);
      } catch (error) {
        throw toUserApiError(error);
      }
    },
    enabled: Boolean(userId),
    retry: false,
  });
}

export type StatusChangeActionName =
  "suspend" | "restrict" | "activate" | "deactivate";

export interface ChangeUserStatusPayload {
  reason: string;
  note: string;
}

interface StatusChangeResponseData {
  user_id: string;
  action: string;
  previous_status: UserAccountStatus;
  status: UserAccountStatus;
  reason: string;
  at: string;
  sessions_revoked?: number;
}

interface StatusChangeApiResponse {
  message: string;
  data: StatusChangeResponseData;
}

export interface StatusChangeResult {
  userId: string;
  action: string;
  previousStatus: UserAccountStatus;
  status: UserAccountStatus;
  reason: string;
  at: string;
  sessionsRevoked: number | null;
  message: string;
}

function toStatusChangeResult(
  response: StatusChangeApiResponse
): StatusChangeResult {
  return {
    userId: response.data.user_id,
    action: response.data.action,
    previousStatus: response.data.previous_status,
    status: response.data.status,
    reason: response.data.reason,
    at: response.data.at,
    sessionsRevoked: response.data.sessions_revoked ?? null,
    message: response.message,
  };
}

function useUserStatusMutation(userId: string, action: StatusChangeActionName) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ChangeUserStatusPayload) => {
      try {
        const { data } = await liveClient.post<StatusChangeApiResponse>(
          `/admin/users/${userId}/${action}`,
          payload
        );
        return toStatusChangeResult(data);
      } catch (error) {
        throw toUserApiError(error);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "detail", userId] });
    },
  });
}

export function useSuspendUser(userId: string) {
  return useUserStatusMutation(userId, "suspend");
}

export function useRestrictUser(userId: string) {
  return useUserStatusMutation(userId, "restrict");
}

export function useActivateUser(userId: string) {
  return useUserStatusMutation(userId, "activate");
}

export function useDeactivateUser(userId: string) {
  return useUserStatusMutation(userId, "deactivate");
}

export function useUnmaskVerificationCheck(userId: string, type: string) {
  return useMutation({
    mutationFn: async () => {
      try {
        const { data } = await liveClient.get<{ data: { value: string } }>(
          `/admin/users/${userId}/verification/${type}/unmask`
        );
        return data.data.value;
      } catch (error) {
        throw toUserApiError(error);
      }
    },
  });
}
