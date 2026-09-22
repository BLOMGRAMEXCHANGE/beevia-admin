export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

const nairaFormat = new Intl.NumberFormat("en-NG");

/** Formats an amount (in naira) as e.g. "₦4,820,000". */
export function formatNaira(amount: number): string {
  return `₦${nairaFormat.format(amount)}`;
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}hrs ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days} days ago`;

  return formatDate(iso);
}

/** Turns an open backend string (e.g. "not_started") into a readable label
 * (e.g. "Not started") for values that don't have a dedicated label map. */
export function humanizeToken(value: string): string {
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

/** Formats an ISO timestamp as e.g. "09/21/2026, 12:09 PM" — for places where
 * the time of day matters (message activity, report timestamps). */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const MONEY_FALLBACK_FORMAT = new Intl.NumberFormat("en-NG", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats a wallet amount in its own currency — e.g. "₦19,000.00". Unlike
 * `formatNaira` this keeps the minor units, because a wallet balance is an
 * exact figure an admin may be reconciling against a bank statement.
 * Falls back to a plain number plus the raw code for currencies `Intl`
 * doesn't recognise, rather than throwing.
 */
export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${MONEY_FALLBACK_FORMAT.format(amount)} ${currency}`.trim();
  }
}
