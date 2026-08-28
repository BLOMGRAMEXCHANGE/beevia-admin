import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone = "green" | "red" | "amber" | "gray" | "blue" | "slate";

const TONE_CLASSES: Record<StatusTone, string> = {
  green:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  red: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  gray: "bg-muted text-muted-foreground",
  blue: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
  // Distinct from plain `gray` (used for the terminal deleting/deleted
  // states) so a deactivated account doesn't read as "gone" the same way.
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
};

export function StatusBadge({
  tone,
  children,
}: {
  tone: StatusTone;
  children: React.ReactNode;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", TONE_CLASSES[tone])}
    >
      {children}
    </Badge>
  );
}
