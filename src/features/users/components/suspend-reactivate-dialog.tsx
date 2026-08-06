"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCurrentAdmin } from "@/hooks/use-current-admin";
import { useUpdateUserStatus } from "@/features/users/api";
import { getSuspensionReasonOptions } from "@/features/users/suspension-reasons";
import type { AppUser, SuspensionReason } from "@/types/user";

export function SuspendReactivateDialog({ user }: { user: AppUser }) {
  const { data: admin } = useCurrentAdmin();
  const isSuspended = user.status === "suspended";
  const reasonOptions = getSuspensionReasonOptions(admin?.role ?? "support");

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<SuspensionReason | "">("");
  const [note, setNote] = useState("");
  const { mutate, isPending } = useUpdateUserStatus(user.id);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason) return;
    mutate(
      {
        status: isSuspended ? "active" : "suspended",
        reason,
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setReason("");
          setNote("");
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant={isSuspended ? "default" : "destructive"} />}
      >
        {isSuspended ? "Reactivate account" : "Suspend account"}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="font-bold">
              {isSuspended ? "Reactivate account" : "Suspend account"}
            </DialogTitle>
            <DialogDescription>
              {isSuspended
                ? "Choose a reason for reactivating this account."
                : "Choose a reason for suspending this account."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="suspend-reason">Reason</Label>
            <Select
              value={reason}
              onValueChange={(value) =>
                setReason((value as SuspensionReason) ?? "")
              }
            >
              <SelectTrigger id="suspend-reason" className="w-full">
                <SelectValue>
                  {reasonOptions.find((option) => option.value === reason)
                    ?.label ?? "Select a reason"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {reasonOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="suspend-note">Note (optional)</Label>
            <Textarea
              id="suspend-note"
              placeholder="Add any additional context…"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              variant={isSuspended ? "default" : "destructive"}
              disabled={isPending || !reason}
            >
              {isPending
                ? "Saving…"
                : isSuspended
                  ? "Reactivate account"
                  : "Suspend account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
