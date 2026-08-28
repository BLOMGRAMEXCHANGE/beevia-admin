import { humanizeToken } from "@/lib/format";

export const CHECK_TYPE_LABEL: Record<string, string> = {
  phone: "Phone",
  email: "Email",
  bvn: "BVN",
  liveness: "Liveness",
  address: "Address",
};

export const CHECK_STATUS_LABEL: Record<string, string> = {
  verified: "Verified",
  failed: "Failed",
  not_started: "Not started",
  pending: "Pending",
};

export function checkTypeLabel(type: string): string {
  return CHECK_TYPE_LABEL[type] ?? humanizeToken(type);
}

export function checkStatusLabel(status: string): string {
  return CHECK_STATUS_LABEL[status] ?? humanizeToken(status);
}
