import { BackButton } from "@/components/shared/back-button";
import { AccountDetail } from "@/features/users/components/account-detail";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <AccountDetail userId={id} />
    </div>
  );
}
