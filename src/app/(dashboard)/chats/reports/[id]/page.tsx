import { BackButton } from "@/components/shared/back-button";
import { ReportDetail } from "@/features/chats/components/report-detail";

export default async function ChatReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <ReportDetail reportId={id} />
    </div>
  );
}
