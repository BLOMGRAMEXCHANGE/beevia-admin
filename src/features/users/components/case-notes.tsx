"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAddCaseNote, useUserCaseNotes } from "@/features/users/api";

export function CaseNotes({ userId }: { userId: string }) {
  const [note, setNote] = useState("");
  const { data: notes, isLoading } = useUserCaseNotes(userId);
  const { mutate: addNote, isPending } = useAddCaseNote(userId);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!note.trim()) return;
    addNote(note, { onSuccess: () => setNote("") });
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Add a case note…"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <Button type="submit" disabled={isPending}>
          Add
        </Button>
      </form>
      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : (
        <ul className="flex flex-col gap-2">
          {notes?.map((caseNote) => (
            <li key={caseNote.id} className="rounded-md border p-3 text-sm">
              <p>{caseNote.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {caseNote.authorName} ·{" "}
                {new Date(caseNote.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
          {notes?.length === 0 && (
            <p className="text-sm text-muted-foreground">No case notes yet.</p>
          )}
        </ul>
      )}
    </div>
  );
}
