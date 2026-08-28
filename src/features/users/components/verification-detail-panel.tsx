"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { UserApiError, useVerificationDetail } from "@/features/users/api";
import { CheckStatusBadge } from "@/features/users/components/check-status-badge";
import { UnmaskControl } from "@/features/users/components/unmask-control";
import { checkTypeLabel } from "@/features/users/verification";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p>{value}</p>
    </div>
  );
}

export function VerificationDetailPanel({ userId }: { userId: string }) {
  const {
    data: verification,
    isLoading,
    isError,
    error,
  } = useVerificationDetail(userId);

  const isNotFound = error instanceof UserApiError && error.status === 404;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">
          Verification / KYC
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : isNotFound ? (
          <p className="text-sm text-muted-foreground">
            This user doesn&apos;t exist, so no verification record could be
            loaded.
          </p>
        ) : isError || !verification ? (
          <p className="text-sm text-muted-foreground">
            {error instanceof UserApiError
              ? error.message
              : "Verification details could not be loaded. Please try again."}
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Field label="KYC level" value={verification.kycLevel || "—"} />
              <Field
                label="Checks passed"
                value={`${verification.checksPassed} of ${verification.checksTotal} checks passed`}
              />
              <Field
                label="Outstanding checks"
                value={
                  verification.outstandingChecks.length === 0
                    ? "None"
                    : verification.outstandingChecks
                        .map(checkTypeLabel)
                        .join(", ")
                }
              />
            </div>

            {verification.checks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No verification checks on file yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {verification.checks.map((check) => (
                  <li
                    key={check.type}
                    className="rounded-md border p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">
                        {checkTypeLabel(check.type)}
                      </p>
                      <CheckStatusBadge status={check.status} />
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <Field label="Provider" value={check.provider ?? "—"} />
                      <Field
                        label="Submitted"
                        value={
                          check.submittedAt
                            ? formatDate(check.submittedAt)
                            : "—"
                        }
                      />
                      <Field
                        label="Approved"
                        value={
                          check.approvedAt ? formatDate(check.approvedAt) : "—"
                        }
                      />
                      <Field
                        label="Failed attempts"
                        value={
                          <span
                            className={cn(
                              "flex items-center gap-1",
                              check.failedAttempts > 0 &&
                                "font-medium text-red-600 dark:text-red-400"
                            )}
                          >
                            {check.failedAttempts > 0 && (
                              <AlertTriangle className="size-3.5" />
                            )}
                            {check.failedAttempts}
                          </span>
                        }
                      />
                    </div>

                    <div className="mt-3">
                      <p className="text-muted-foreground">Masked value</p>
                      <UnmaskControl
                        userId={userId}
                        type={check.type}
                        maskedValue={check.maskedValue}
                      />
                    </div>

                    <div className="mt-3 text-xs text-muted-foreground">
                      {check.reviewedBy ||
                      check.reviewedAt ||
                      check.reviewNote ? (
                        <p>
                          Reviewed by {check.reviewedBy ?? "—"}
                          {check.reviewedAt
                            ? ` on ${formatDate(check.reviewedAt)}`
                            : ""}
                          {check.reviewNote ? ` — ${check.reviewNote}` : ""}
                        </p>
                      ) : (
                        <p>Not yet reviewed</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
