/**
 * Eastern-time helpers. All "what time/day is it" logic must go through here.
 *
 * The scraper stores `last_updated_at` as a NAIVE Eastern-time string
 * ('2026-06-10T16:13:35.627', no Z). NEVER pass one of these to
 * `new Date(...)`: a browser parses it in the viewer's local zone and the
 * server (UTC on Vercel) shifts it by 4-5 hours. Read fields from the string
 * itself, and compare against "now" derived via Intl in America/New_York.
 */

const ET_TIME_ZONE = "America/New_York";

export type ETParts = {
  dateStr: string; // 'YYYY-MM-DD'
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  dayOfWeek: number; // 0=Sun … 6=Sat — matches SQLite strftime('%w')
};

const ET_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: ET_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
});

const WEEKDAY_TO_NUM: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function toETParts(date: Date): ETParts {
  const parts: Record<string, string> = {};
  for (const p of ET_FORMAT.formatToParts(date)) {
    parts[p.type] = p.value;
  }
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  return {
    dateStr: `${parts.year}-${parts.month}-${parts.day}`,
    year,
    month,
    day,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    dayOfWeek: WEEKDAY_TO_NUM[parts.weekday],
  };
}

/** Current wall-clock time in Eastern time, regardless of runtime timezone. */
export function nowET(): ETParts {
  return toETParts(new Date());
}

/** Today's date in Eastern time as 'YYYY-MM-DD'. */
export function todayET(): string {
  return nowET().dateStr;
}

// Calendar math on 'YYYY-MM-DD' strings uses noon-UTC anchors: pure date
// arithmetic with no DST exposure.
function atNoonUTC(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00Z`);
}

export function addDaysET(dateStr: string, days: number): string {
  const d = atNoonUTC(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `a` to `b` (positive when b is later). */
export function daysBetween(a: string, b: string): number {
  return Math.round((atNoonUTC(b).getTime() - atNoonUTC(a).getTime()) / 86_400_000);
}

/** Day of week (0=Sun … 6=Sat) for a 'YYYY-MM-DD' string. */
export function dayOfWeekOf(dateStr: string): number {
  return atNoonUTC(dateStr).getUTCDay();
}

// Comparable-ms trick: treating naive ET strings as pseudo-UTC makes
// differences between two such values correct wall-clock deltas. The one soft
// spot is the hour surrounding a DST transition (next: Nov 1 2026, 1-2 AM ET),
// when minutesAgoET can be off by exactly 1h — the gym is closed then.
export function etToComparableMs(naive: string): number {
  return Date.parse(`${naive}Z`);
}

export function comparableMsOf(parts: ETParts): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
}

/**
 * Minutes elapsed from a naive ET string to `now`. Callers pass the ticked
 * `now` (seeded from serverNow) so server HTML and client hydration agree.
 */
export function minutesAgoET(naive: string, now: ETParts): number {
  return (comparableMsOf(now) - etToComparableMs(naive)) / 60_000;
}

/**
 * Comparable ms for a TRUE-UTC instant (trailing 'Z', e.g. `fetched_at`).
 * Unlike naive ET strings, these are safe to hand to `new Date(...)`.
 */
export function utcToComparableMs(utcIso: string): number {
  return comparableMsOf(toETParts(new Date(utcIso)));
}

/**
 * Minutes elapsed from a TRUE-UTC instant (e.g. `fetched_at`) to `now`. This is
 * the pipeline-liveness signal: an old `last_updated_at` only means the count is
 * unchanged, but an old `fetched_at` means the scraper hasn't seen this zone.
 */
export function minutesSinceUTC(utcIso: string, now: ETParts): number {
  return (comparableMsOf(now) - utcToComparableMs(utcIso)) / 60_000;
}

/** Hour of day with minute fraction (16:30 → 16.5) from a naive ET string. */
export function etHourFraction(naive: string): number {
  return Number(naive.slice(11, 13)) + Number(naive.slice(14, 16)) / 60;
}

/** '4:31 PM' from a naive ET string, by slicing — no Date parsing. */
export function formatTimeLabel(naive: string): string {
  const hour = Number(naive.slice(11, 13));
  const minute = naive.slice(14, 16);
  const hour12 = hour % 12 || 12;
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${hour12}:${minute} ${ampm}`;
}

/** '4 PM' from an hour number. */
export function formatHourLabel(hour: number): string {
  const hour12 = hour % 12 || 12;
  return `${hour12} ${hour >= 12 ? "PM" : "AM"}`;
}

const DATE_LABEL_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC", // paired with noon-UTC anchors; renders the calendar date as-is
  weekday: "short",
  month: "short",
  day: "numeric",
});

/** 'Wed, Jun 10' from a 'YYYY-MM-DD' string. */
export function formatDateLabel(dateStr: string): string {
  return DATE_LABEL_FORMAT.format(atNoonUTC(dateStr));
}
