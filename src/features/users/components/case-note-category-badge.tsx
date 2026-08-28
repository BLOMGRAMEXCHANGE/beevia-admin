import { StatusBadge } from "@/components/shared/status-badge";
import {
  CASE_NOTE_CATEGORY_LABEL,
  CASE_NOTE_CATEGORY_TONE,
} from "@/features/users/case-note-categories";

export function CaseNoteCategoryBadge({ category }: { category: string }) {
  return (
    <StatusBadge tone={CASE_NOTE_CATEGORY_TONE[category] ?? "gray"}>
      {CASE_NOTE_CATEGORY_LABEL[category] ?? category}
    </StatusBadge>
  );
}
