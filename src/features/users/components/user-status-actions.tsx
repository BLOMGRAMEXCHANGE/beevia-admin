"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentAdmin } from "@/hooks/use-current-admin";
import {
  UserApiError,
  useActivateUser,
  useDeactivateUser,
  useRestrictUser,
  useSuspendUser,
  type StatusChangeResult,
} from "@/features/users/api";
import {
  USER_STATUS_CHANGE_REASONS,
  type UserStatusChangeReason,
} from "@/features/users/status-change-reasons";
import {
  STATUS_ACTIONS,
  type StatusActionConfig,
} from "@/features/users/status-actions";
import type { UserRecord } from "@/types/user";

function sessionsRevokedSuffix(result: StatusChangeResult): string {
  if (!result.sessionsRevoked) return "";
  const count = result.sessionsRevoked;
  return ` ${count} active session${count === 1 ? "" : "s"} ${
    count === 1 ? "was" : "were"
  } signed out.`;
}

function StatusActionButton({
  config,
  userId,
}: {
  config: StatusActionConfig;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<UserStatusChangeReason>(
    USER_STATUS_CHANGE_REASONS[0].value
  );
  const [note, setNote] = useState("");
  const suspend = useSuspendUser(userId);
  const restrict = useRestrictUser(userId);
  const activate = useActivateUser(userId);
  const deactivate = useDeactivateUser(userId);
  const { mutate, isPending } = {
    suspend,
    restrict,
    activate,
    deactivate,
  }[config.action];
  const isSevere = config.severity === "severe";

  function resetForm() {
    setNote("");
    setReason(USER_STATUS_CHANGE_REASONS[0].value);
  }

  function handleConfirm() {
    if (!note.trim()) return;
    mutate(
      { reason, note: note.trim() },
      {
        onSuccess: (result) => {
          toast.success(`${result.message}${sessionsRevokedSuffix(result)}`);
          setOpen(false);
          resetForm();
        },
        onError: (mutationError) => {
          toast.error(
            mutationError instanceof UserApiError
              ? mutationError.message
              : "Something went wrong. Please try again."
          );
        },
      }
    );
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <AlertDialogTrigger
        render={
          <Button variant={isSevere ? "destructive" : "outline"} size="sm">
            {config.label}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{config.label} this account?</AlertDialogTitle>
          <AlertDialogDescription>
            {isSevere
              ? "This is the most severe of the account actions — typically used for a legal or regulatory hold. It signs out any active sessions immediately. Provide a reason and note before continuing."
              : "This takes effect immediately. Provide a reason and note for the record."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${config.action}-reason`}>Reason</Label>
            <Select
              value={reason}
              onValueChange={(value) =>
                value && setReason(value as UserStatusChangeReason)
              }
            >
              <SelectTrigger id={`${config.action}-reason`} className="w-full">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {USER_STATUS_CHANGE_REASONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${config.action}-note`}>Note</Label>
            <Textarea
              id={`${config.action}-note`}
              placeholder="Add a note explaining this action…"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </AlertDialogClose>
          <Button
            variant={isSevere ? "destructive" : "default"}
            disabled={isPending || !note.trim()}
            onClick={handleConfirm}
          >
            {isPending ? config.loadingLabel : config.label}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function UserStatusActions({ user }: { user: UserRecord }) {
  const { hasPermission } = useCurrentAdmin();

  if (user.status === "deleting") {
    return (
      <p className="text-sm text-muted-foreground">
        Account deletion in progress.
      </p>
    );
  }
  if (user.status === "deleted") {
    return <p className="text-sm text-muted-foreground">Account deleted.</p>;
  }

  const availableActions = STATUS_ACTIONS.filter(
    (config) =>
      config.availableFrom.includes(user.status) &&
      hasPermission(config.permission.module, config.permission.action)
  );

  if (availableActions.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {availableActions.map((config) => (
        <StatusActionButton
          key={config.action}
          config={config}
          userId={user.id}
        />
      ))}
    </div>
  );
}
