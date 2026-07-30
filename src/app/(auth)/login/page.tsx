"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { setAccessToken } from "@/lib/token-store";
import type { AdminRole } from "@/types/admin";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { data } = await apiClient.post<{
        accessToken: string;
        role?: AdminRole;
      }>("/auth/login", { email, password });
      setAccessToken(data.accessToken);
      if (data.role) {
        document.cookie = `admin_session=mock; path=/`;
        document.cookie = `admin_role=${data.role}; path=/`;
      }
      router.push("/users");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center font-heading text-xl font-bold">
          Admin Portal
        </CardTitle>
        <CardDescription className="text-center">
          Sign in to manage the Beevia platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {USE_MOCKS && (
          <div className="mb-4 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">
              Preview mode — any password works
            </p>
            <p>support@beevia.dev — Support</p>
            <p>compliance@beevia.dev — Compliance</p>
            <p>admin@beevia.dev — Super Admin</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Work Email</Label>
            <InputGroup>
              <InputGroupAddon>
                <Mail />
              </InputGroupAddon>
              <InputGroupInput
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </InputGroup>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <InputGroup>
              <InputGroupAddon>
                <Lock />
              </InputGroupAddon>
              <InputGroupInput
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox id="remember-me" />
              <Label htmlFor="remember-me" className="font-normal">
                Remember Me
              </Label>
            </div>
            <Link href="/forgot-password" className="text-sm hover:underline">
              Forgot Password ?
            </Link>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
