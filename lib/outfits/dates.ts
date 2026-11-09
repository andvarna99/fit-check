// Date-only helpers for wear logs. Wear dates are calendar days ("2026-11-09")
// in the user's own time zone, so "today" always comes from the device.

const DAY_MS = 86_400_000;

function toUtcMs(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtcMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** The device's local calendar date. */
export function localIsoDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return fromUtcMs(toUtcMs(value)) === value;
}

/**
 * Whether a device's "today" is believable on the server: time zones put the
 * local date at most one day either side of the UTC date.
 */
export function isPlausibleToday(iso: string, now: Date = new Date()): boolean {
  if (!isIsoDate(iso)) return false;
  const diff = toUtcMs(iso) - toUtcMs(now.toISOString().slice(0, 10));
  return Math.abs(diff) <= DAY_MS;
}

/** Monday of the week containing `iso`. */
function weekStart(iso: string): number {
  const ms = toUtcMs(iso);
  const weekday = (new Date(ms).getUTCDay() + 6) % 7; // Monday = 0
  return ms - weekday * DAY_MS;
}

const weekdayFmt = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
const longFmt = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
const monthFmt = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" });
const monthYearFmt = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

/** "Today · Mon, Nov 9", "Yesterday · Sun, Nov 8", or "Sat, Nov 7". */
export function wearDayLabel(iso: string, today: string): string {
  const label = weekdayFmt.format(toUtcMs(iso));
  const diff = Math.round((toUtcMs(today) - toUtcMs(iso)) / DAY_MS);
  if (diff === 0) return `Today · ${label}`;
  if (diff === 1) return `Yesterday · ${label}`;
  return label;
}

/** "Saturday, Nov 7" for the wear entry title. */
export function wearDayTitle(iso: string): string {
  return longFmt.format(toUtcMs(iso));
}

/** History section heading: "This week", "Last week", "October", or "October 2025". */
export function historyGroupLabel(iso: string, today: string): string {
  const weeks = Math.round((weekStart(today) - weekStart(iso)) / (7 * DAY_MS));
  if (weeks <= 0) return "This week";
  if (weeks === 1) return "Last week";
  const sameYear = iso.slice(0, 4) === today.slice(0, 4);
  return (sameYear ? monthFmt : monthYearFmt).format(toUtcMs(iso));
}

/** Groups entries (already newest first) under consecutive history headings. */
export function groupByHistoryLabel<T extends { wornOn: string }>(entries: T[], today: string): Array<{ label: string; entries: T[] }> {
  const groups: Array<{ label: string; entries: T[] }> = [];
  for (const entry of entries) {
    const label = historyGroupLabel(entry.wornOn, today);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.entries.push(entry);
    else groups.push({ label, entries: [entry] });
  }
  return groups;
}
