import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";
import type { AppUser, KycResult } from "@/types/user";

const RESULT_LABEL: Record<KycResult, string> = {
  passed: "Passed",
  pending: "Pending",
  failed: "Failed",
};

const RESULT_TONE: Record<KycResult, StatusTone> = {
  passed: "green",
  pending: "amber",
  failed: "red",
};

const METHOD_LABEL = {
  face: "Face verification",
  record: "Record verification",
};

// TODO(backend): this panel is gated client-side by role, but the API must
// also enforce it server-side — a Support-role request should never receive
// the kyc object (or an unmasked BVN) at all, not just have it hidden in the UI.
export function KycPanel({ user }: { user: AppUser }) {
  if (!user.kyc) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">
            KYC / Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No verification record on file yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { kyc } = user;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="font-heading text-base">
          KYC / Verification
        </CardTitle>
        <StatusBadge tone={RESULT_TONE[kyc.result]}>
          {RESULT_LABEL[kyc.result]}
        </StatusBadge>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground">Method</p>
          <p>{METHOD_LABEL[kyc.method]}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Verified at</p>
          <p>{formatDate(kyc.verifiedAt)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">BVN</p>
          <p className="font-mono">•••• ••{kyc.bvnLast4}</p>
        </div>
      </CardContent>
    </Card>
  );
}
