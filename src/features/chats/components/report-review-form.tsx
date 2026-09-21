"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChatApiError, useReviewReport } from "@/features/chats/api";
import {
  REPORT_DECISIONS,
  REVIEW_NOTE_MAX_LENGTH,
} from "@/features/chats/constants";
import { cn } from "@/lib/utils";
import type { ReportDecision, ReportDetail } from "@/features/chats/types";

export function ReportReviewForm({ report }: { report: ReportDetail }) {
  const [decision, setDecision] = useState<ReportDecision | null>(
    report.status === "pending" ? null : report.status
  );
  // Pre-filled from the existing note because the API treats an empty note as
  // "clear it" — an admin changing only the decision shouldn't silently wipe
  // what the last reviewer wrote.
  const [note, setNote] = useState(report.review?.note ?? "");

  const { mutate: review, isPending } = useReviewReport(report.id);

  const isTooLong = note.length > REVIEW_NOTE_MAX_LENGTH;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!decision || isTooLong) return;

    review(
      { status: decision, note: note.trim() },
      {
        onSuccess: (updated) => {
          toast.success(`Report marked as ${updated.status}.`);
        },
        onError: (mutationError) => {
          if (mutationError instanceof ChatApiError) {
            if (mutationError.status === 403) {
              toast.error(
                "You don't have permission to review reports. This needs chat edit access."
              );
              return;
            }
            if (mutationError.status === 404) {
              toast.error("This report no longer exists.");
              return;
            }
          }
          toast.error(
            mutationError instanceof Error
              ? mutationError.message
              : "Something went wrong. Please try again."
          );
        },
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Decision</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {REPORT_DECISIONS.map((option) => {
            const isSelected = decision === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setDecision(option.value)}
                className={cn(
                  "flex flex-col gap-0.5 rounded-lg border p-3 text-left transition-colors hover:bg-muted",
                  isSelected && "border-primary bg-muted"
                )}
              >
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  {option.label}
                  {isSelected && <Check className="size-3.5 text-primary" />}
                </span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="review-note">Note (optional)</Label>
        <Textarea
          id="review-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What did you find, and what did you do about it?"
          aria-invalid={isTooLong || undefined}
          className="min-h-24"
        />
        <p
          className={cn(
            "text-xs",
            isTooLong ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {note.length} / {REVIEW_NOTE_MAX_LENGTH}
          {report.review?.note &&
            " · Saving replaces the note recorded with the last decision."}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!decision || isTooLong || isPending}>
          {isPending ? "Saving…" : "Record decision"}
        </Button>
        {/* Spelled out because it changes how freely an admin should click. */}
        <p className="text-sm text-muted-foreground">
          Recorded against your account and written to the activity feed.
        </p>
      </div>
    </form>
  );
}
