import { BackButton } from "@/components/shared/back-button";
import { TransferDetail } from "@/features/pending-transfers/components/transfer-detail";

export default async function TransferDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Transfer detail
        </h1>
      </div>
      <TransferDetail reference={decodeURIComponent(reference)} />
    </div>
  );
}
