/**
 * Northeastern academic calendar + facility closure rules.
 *
 * EDIT HERE when NEU publishes official dates (https://registrar.northeastern.edu).
 * Dates are inclusive ET calendar dates ('YYYY-MM-DD'). Boundary dates below are
 * estimates consistent with the observed data; adjusting them only shifts which
 * readings feed each semester's baselines.
 */

import { todayET, dayOfWeekOf, daysBetween } from "@/lib/time";

export type SubSession = {
  id: string;
  label: string;
  start: string;
  end: string;
};

export type Semester = {
  id: string;
  label: string;
  start: string; // inclusive
  end: string; // inclusive
  /** Regular (fall/spring) semesters: full weekend facility hours. */
  isRegular: boolean;
  subSessions?: SubSession[];
};

export const SEMESTERS: Semester[] = [
  {
    id: "spring2026",
    label: "Spring 2026",
    start: "2026-01-05",
    end: "2026-05-03",
    isRegular: true,
  },
  {
    id: "summer2026",
    label: "Summer 2026",
    start: "2026-05-04",
    end: "2026-08-23",
    isRegular: false,
    subSessions: [
      { id: "summer1-2026", label: "Summer 1", start: "2026-05-04", end: "2026-06-24" },
      { id: "summer2-2026", label: "Summer 2", start: "2026-06-29", end: "2026-08-19" },
    ],
  },
  {
    id: "fall2026",
    label: "Fall 2026",
    start: "2026-09-08",
    end: "2026-12-19",
    isRegular: true,
  },
];

export const SQUASHBUSTERS = "SquashBusters Center";

export type Closure = {
  date: string;
  reason: string;
  /** Omitted = all facilities closed (e.g. snowstorm, university holiday). */
  facilityName?: string;
};

export const CLOSURES: Closure[] = [
  { date: "2026-02-23", reason: "Snowstorm" },
  { date: "2026-05-25", reason: "Memorial Day" },
  // SquashBusters spring-break weekends (regular-semester window, so the
  // weekend rule below doesn't cover them).
  { date: "2026-02-28", reason: "Weekend closure", facilityName: SQUASHBUSTERS },
  { date: "2026-03-01", reason: "Weekend closure", facilityName: SQUASHBUSTERS },
  { date: "2026-03-07", reason: "Weekend closure", facilityName: SQUASHBUSTERS },
  { date: "2026-03-08", reason: "Weekend closure", facilityName: SQUASHBUSTERS },
];

export type WeekendClosureRule = {
  facilityName: string;
  start: string;
  end: string;
  reason: string;
};

/** SquashBusters is closed every Sat+Sun from end of spring classes through summer. */
export const WEEKEND_CLOSURES: WeekendClosureRule[] = [
  {
    facilityName: SQUASHBUSTERS,
    start: "2026-04-25",
    end: "2026-09-07",
    reason: "Closed weekends (summer hours)",
  },
];

export function semesterFor(dateStr: string): Semester | null {
  return SEMESTERS.find((s) => s.start <= dateStr && dateStr <= s.end) ?? null;
}

/**
 * Semester for today. In inter-semester gaps, falls back to the most recent
 * semester that has started so baselines always have a data window.
 */
export function currentSemester(): Semester {
  const today = todayET();
  const exact = semesterFor(today);
  if (exact) return exact;
  const started = SEMESTERS.filter((s) => s.start <= today);
  return started[started.length - 1] ?? SEMESTERS[0];
}

export function weekOfSemester(dateStr: string, semester: Semester = currentSemester()): number {
  return Math.max(1, Math.floor(daysBetween(semester.start, dateStr) / 7) + 1);
}

/** Closure reason for a facility on a date, or null when open. */
export function isClosed(facilityName: string | null, dateStr: string): string | null {
  for (const c of CLOSURES) {
    if (c.date !== dateStr) continue;
    if (!c.facilityName || c.facilityName === facilityName) return c.reason;
  }
  const dow = dayOfWeekOf(dateStr);
  if (dow === 0 || dow === 6) {
    for (const rule of WEEKEND_CLOSURES) {
      if (rule.facilityName === facilityName && rule.start <= dateStr && dateStr <= rule.end) {
        return rule.reason;
      }
    }
  }
  return null;
}

/**
 * Whether a weekend-closure rule covers this facility for the whole semester
 * window on the given day of week — drives the heatmap's "Closed" rows.
 */
export function isClosedOnDayOfWeek(
  facilityName: string | null,
  semester: Semester,
  dayOfWeek: number
): WeekendClosureRule | null {
  if (dayOfWeek !== 0 && dayOfWeek !== 6) return null;
  return (
    WEEKEND_CLOSURES.find(
      (rule) =>
        rule.facilityName === facilityName &&
        rule.start <= semester.start &&
        semester.end <= rule.end
    ) ?? null
  );
}

/** Dates when ALL facilities were closed — excluded from baseline SQL. */
export function globalClosureDates(): string[] {
  return CLOSURES.filter((c) => !c.facilityName).map((c) => c.date);
}
