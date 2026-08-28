import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AcceptInviteForm } from "@/features/auth/components/accept-invite-form";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ adminId?: string; token?: string }>;
}) {
  const { adminId, token } = await searchParams;

  if (!adminId || !token) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center font-heading text-xl font-bold">
            Invalid invite link
          </CardTitle>
          <CardDescription className="text-center">
            This invite link is invalid or incomplete.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return <AcceptInviteForm adminId={adminId} token={token} />;
}
