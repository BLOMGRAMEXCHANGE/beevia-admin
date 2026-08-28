"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthApiError, acceptInvite } from "@/features/auth/api";

interface AcceptInviteFormProps {
  adminId: string;
  token: string;
}

export function AcceptInviteForm({ adminId, token }: AcceptInviteFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isInviteInvalid, setIsInviteInvalid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsInviteInvalid(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const admin = await acceptInvite(adminId, token, password);
      document.cookie = `admin_session=1; path=/`;
      document.cookie = `admin_role=${admin.role}; path=/`;
      queryClient.setQueryData(["current-admin"], admin);
      router.push("/");
    } catch (err) {
      if (err instanceof AuthApiError && err.status === 401) {
        setIsInviteInvalid(true);
      } else {
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isInviteInvalid) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center font-heading text-xl font-bold">
            Invite no longer valid
          </CardTitle>
          <CardDescription className="text-center">
            This invite link is no longer valid. Ask your admin to send a new
            one.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center font-heading text-xl font-bold">
          Set your password
        </CardTitle>
        <CardDescription className="text-center">
          Choose a password to activate your Beevia admin account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <InputGroup>
              <InputGroupAddon>
                <Lock />
              </InputGroupAddon>
              <InputGroupInput
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </InputGroup>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <InputGroup>
              <InputGroupAddon>
                <Lock />
              </InputGroupAddon>
              <InputGroupInput
                id="confirm-password"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </InputGroup>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Setting password…" : "Activate account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
