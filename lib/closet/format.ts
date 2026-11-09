const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const usdWhole = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** 5000 → "$50", 4999 → "$49.99" */
export function formatPrice(cents: number): string {
  return cents % 100 === 0 ? usdWhole.format(cents / 100) : usd.format(cents / 100);
}

/** Cents → "50" / "49.99" for the price input. */
export function priceInputValue(cents: number | null): string {
  if (cents === null) return "";
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

/**
 * Price divided by wears, rounded to cents. Unworn items show the full price
 * (what the next wear would cost). Null when there's no price.
 */
export function costPerWearCents(priceCents: number | null, timesWorn: number): number | null {
  if (priceCents === null) return null;
  return Math.round(priceCents / Math.max(timesWorn, 1));
}

/** "2026-03-14" → "Mar 14, 2026" (date-only values, no timezone shift). */
export function formatDate(isoDate: string, opts: { year?: boolean } = { year: true }): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(opts.year ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}
