"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  AdminAccountApiError,
  useInviteAdmin,
} from "@/features/admin-accounts/api";
import { useRoles } from "@/features/roles/api";

const ROLE_SELECT_LIMIT = 100;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readInviteDeepLink(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("invite") === "1";
}

export function InviteAdminDialog() {
  // Deep-link support: /admin-accounts?invite=1 (e.g. the dashboard Quick
  // Action) opens this dialog on load.
  const [open, setOpen] = useState(readInviteDeepLink);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [forbiddenError, setForbiddenError] = useState<string | null>(null);

  const { data: rolesData, isLoading: isLoadingRoles } = useRoles(
    1,
    ROLE_SELECT_LIMIT
  );
  const { mutate, isPending } = useInviteAdmin();

  // Strip the ?invite param once consumed so a refresh doesn't reopen it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("invite")) return;
    params.delete("invite");
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (query ? `?${query}` : "")
    );
  }, []);

  function resetForm() {
    setFullName("");
    setEmail("");
    setRoleId("");
    setEmailError(null);
    setForbiddenError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) resetForm();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailError(null);
    setForbiddenError(null);

    if (!EMAIL_PATTERN.test(email)) {
      setEmailError("Enter a valid email address.");
      return;
    }

    mutate(
      { fullName: fullName.trim(), email: email.trim(), roleId },
      {
        onSuccess: (result) => {
          toast.success(`Invite sent to ${result.email}`);
          setOpen(false);
          resetForm();
        },
        onError: (mutationError) => {
          if (mutationError instanceof AdminAccountApiError) {
            if (mutationError.status === 409) {
              setEmailError(mutationError.message);
              return;
            }
            if (mutationError.status === 403) {
              setForbiddenError(
                mutationError.message ||
                  "You do not have permission to perform this action."
              );
              return;
            }
            toast.error(mutationError.message);
            return;
          }
          toast.error("Something went wrong. Please try again.");
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>Invite Admin</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="font-bold">Invite admin</DialogTitle>
            <DialogDescription>
              Send an invite to add a new admin account.
            </DialogDescription>
          </DialogHeader>

          {forbiddenError && (
            <p className="text-sm text-destructive">{forbiddenError}</p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-full-name">Full Name</Label>
            <Input
              id="invite-full-name"
              placeholder="Jane Doe"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError(null);
              }}
              aria-invalid={Boolean(emailError)}
              required
            />
            {emailError && (
              <p className="text-sm text-destructive">{emailError}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-role">Role</Label>
            {isLoadingRoles ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <Select
                value={roleId}
                onValueChange={(value) => value && setRoleId(value)}
              >
                <SelectTrigger id="invite-role" className="w-full">
                  <SelectValue placeholder="Select a role">
                    {rolesData?.roles.find((role) => role.id === roleId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(rolesData?.roles ?? []).map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isPending || !roleId}>
              {isPending ? "Sending…" : "Send invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
