import {
  FileText,
  ScrollText,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * Report types the backend lists in its catalogue but hasn't built yet.
 * They're dropped from the catalogue on arrival, so they never appear in the
 * gallery or the recent-reports type filter, and can't be generated.
 * Remove a slug from here once its report ships.
 */
const UNAVAILABLE_REPORT_TYPES = new Set<string>(["kyc_verifications"]);

export function isReportTypeAvailable(typeId: string): boolean {
  return !UNAVAILABLE_REPORT_TYPES.has(typeId);
}

/**
 * Presentation-only extras for the server-owned report catalogue. The backend
 * decides which report types exist; this just picks an icon for the gallery
 * card. Unknown slugs fall back to a generic document icon, so a new report
 * type ships without a frontend change.
 */
const ICONS: Record<string, LucideIcon> = {
  user_signups: Users,
  transactions: Wallet,
  admin_activity: ScrollText,
};

/** Loose matches for slugs we haven't seen, e.g. `transactions_by_channel`. */
const ICON_PATTERNS: [RegExp, LucideIcon][] = [
  [/user|signup|customer/i, Users],
  [/transaction|payout|wallet|financial|settlement/i, Wallet],
  [/admin|audit|activity/i, ScrollText],
];

export function iconForReportType(typeId: string): LucideIcon {
  const exact = ICONS[typeId];
  if (exact) return exact;
  return (
    ICON_PATTERNS.find(([pattern]) => pattern.test(typeId))?.[1] ?? FileText
  );
}
