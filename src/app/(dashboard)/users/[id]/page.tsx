import { AccountDetail } from "@/features/users/components/account-detail";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl">Account detail</h1>
      <AccountDetail userId={id} />
    </div>
  );
}
