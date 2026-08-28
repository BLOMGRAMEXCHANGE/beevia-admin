"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  UserApiError,
  useAddCaseNote,
  useCaseNotes,
} from "@/features/users/api";
import {
  CASE_NOTE_CATEGORIES,
  type CaseNoteCategory,
} from "@/features/users/case-note-categories";
import { CaseNoteCategoryBadge } from "@/features/users/components/case-note-category-badge";

export function CaseNotes({ userId }: { userId: string }) {
  const [category, setCategory] = useState<CaseNoteCategory>("other");
  const [body, setBody] = useState("");
  const { data: notes, isLoading, isError, error } = useCaseNotes(userId);
  const { mutate: addNote, isPending } = useAddCaseNote(userId);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) return;

    addNote(
      { category, body: body.trim() },
      {
        onSuccess: () => {
          setBody("");
          setCategory("other");
          toast.success("Case note added.");
        },
        onError: (mutationError) => {
          if (
            mutationError instanceof UserApiError &&
            mutationError.status === 404
          ) {
            toast.error(
              "This user no longer exists, so the note couldn't be saved."
            );
            return;
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

  const isNotFound = error instanceof UserApiError && error.status === 404;

  const sortedNotes = notes
    ? [...notes].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="case-note-category">Category</Label>
          <Select
            value={category}
            onValueChange={(value) =>
              value && setCategory(value as CaseNoteCategory)
            }
          >
            <SelectTrigger id="case-note-category" className="w-full sm:w-56">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {CASE_NOTE_CATEGORIES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="case-note-body">Note</Label>
          <Textarea
            id="case-note-body"
            placeholder="Add a case note…"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </div>
        <div>
          <Button type="submit" disabled={isPending || !body.trim()}>
            {isPending ? "Adding…" : "Add note"}
          </Button>
        </div>
      </form>

      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : isNotFound ? (
        <p className="text-sm text-muted-foreground">
          This user doesn&apos;t exist, so no case notes could be loaded.
        </p>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">
          {error instanceof UserApiError
            ? error.message
            : "Case notes could not be loaded. Please try again."}
        </p>
      ) : !sortedNotes || sortedNotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No case notes yet</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sortedNotes.map((caseNote) => (
            <li key={caseNote.id} className="rounded-md border p-3 text-sm">
              <div className="mb-1.5">
                <CaseNoteCategoryBadge category={caseNote.category} />
              </div>
              <p>{caseNote.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {caseNote.authorFullName} ·{" "}
                {new Date(caseNote.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
