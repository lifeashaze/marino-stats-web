/**
 * Aggregated data layer. One Turso roundtrip (db.batch) produces the full
 * DashboardData payload: ~200 KB instead of the ~3 MB raw-row dump it replaces.
 *
 * All date/hour bucketing happens in SQL on the literal naive-ET strings
 * (see lib/time.ts) — date()/strftime() on them yield correct ET values.
 */

import type { InStatement } from "@libsql/client";
import { db } from "@/lib/db";
import { currentSemester, globalClosureDates, SEMESTERS } from "@/lib/academic-calendar";
import { nowET, todayET, type ETParts } from "@/lib/time";

export type Zone = {
  locationId: number;
  locationName: string;
  facilityName: string | null;
  totalCapacity: number | null;
};

export type Reading = {
  locationId: number;
  count: number;
  /** Naive ET 'YYYY-MM-DDTHH:MM:SS.SSS' — never Date.parse() this raw. */
  recordedAt: string;
};

export type HourlyBaseline = {
  locationId: number;
  dayOfWeek: number; // 0=Sun … 6=Sat (SQLite %w)
  hour: number; // 0-23 ET
  avgCount: number;
  samples: number;
};

export type SemesterHourlyAvg = {
  semesterId: string;
  locationId: number;
  hour: number;
  avgCount: number;
  samples: number;
};

export type LatestReading = {
  locationId: number;
  count: number;
  recordedAt: string; // naive ET
  fetchedAt: string; // UTC ISO with Z — scraper-liveness debugging
};

export type DashboardData = {
  todayET: string;
  /** Hydration-safe initial "now" for the client (corrected post-mount). */
  serverNow: ETParts;
  currentSemesterId: string;
  zones: Zone[];
  /** Up to 8 'YYYY-MM-DD' dates with data, descending. */
  recentDates: string[];
  recentReadings: Reading[];
  /** Current semester only; excludes today and global closure dates. */
  baselines: HourlyBaseline[];
  semesterHourly: SemesterHourlyAvg[];
  latest: LatestReading[];
};

const ZONES_SQL = `
  SELECT location_id, location_name, facility_name, total_capacity
  FROM locations
  ORDER BY facility_name, location_name
`;

// GROUP BY dedupes re-fetched readings (PK is (location_id, fetched_at), so
// the same last_updated_at can appear twice).
const RECENT_READINGS_SQL = `
  WITH recent_dates AS (
    SELECT DISTINCT date(last_updated_at) AS d
    FROM location_counts
    ORDER BY d DESC
    LIMIT 8
  )
  SELECT location_id, last_updated_at, MAX(last_count) AS last_count
  FROM location_counts
  WHERE date(last_updated_at) IN (SELECT d FROM recent_dates)
  GROUP BY location_id, last_updated_at
  ORDER BY location_id, last_updated_at
`;

// Closure exclusion is defensive — closed days have no rows today, but a
// scraper that records zeros on a closed day would otherwise poison averages.
function baselineStatement(start: string, end: string, today: string): InStatement {
  const closures = globalClosureDates();
  const placeholders = closures.map(() => "?").join(", ") || "''";
  return {
    sql: `
      SELECT location_id,
             CAST(strftime('%w', last_updated_at) AS INTEGER) AS day_of_week,
             CAST(strftime('%H', last_updated_at) AS INTEGER) AS hour,
             ROUND(AVG(last_count), 1) AS avg_count,
             COUNT(*) AS samples
      FROM location_counts
      WHERE date(last_updated_at) >= ?
        AND date(last_updated_at) <= ?
        AND date(last_updated_at) < ?
        AND date(last_updated_at) NOT IN (${placeholders})
      GROUP BY location_id, day_of_week, hour
    `,
    args: [start, end, today, ...closures],
  };
}

function semesterHourlyStatement(start: string, end: string, today: string): InStatement {
  const closures = globalClosureDates();
  const placeholders = closures.map(() => "?").join(", ") || "''";
  return {
    sql: `
      SELECT location_id,
             CAST(strftime('%H', last_updated_at) AS INTEGER) AS hour,
             ROUND(AVG(last_count), 1) AS avg_count,
             COUNT(*) AS samples
      FROM location_counts
      WHERE date(last_updated_at) >= ?
        AND date(last_updated_at) <= ?
        AND date(last_updated_at) < ?
        AND date(last_updated_at) NOT IN (${placeholders})
      GROUP BY location_id, hour
    `,
    args: [start, end, today, ...closures],
  };
}

const LATEST_SQL = `
  SELECT lc.location_id, lc.last_count, lc.last_updated_at, lc.fetched_at
  FROM location_counts AS lc
  JOIN (
    SELECT location_id, MAX(fetched_at) AS max_fetched
    FROM location_counts
    GROUP BY location_id
  ) AS latest
    ON latest.location_id = lc.location_id
   AND latest.max_fetched = lc.fetched_at
`;

export async function getDashboardData(): Promise<DashboardData | null> {
  if (!db) return null;

  const serverNow = nowET();
  const today = todayET();
  const semester = currentSemester();

  const [zonesRes, readingsRes, baselinesRes, ...rest] = await db.batch(
    [
      ZONES_SQL,
      RECENT_READINGS_SQL,
      baselineStatement(semester.start, semester.end, today),
      ...SEMESTERS.map((s) => semesterHourlyStatement(s.start, s.end, today)),
      LATEST_SQL,
    ],
    "read"
  );
  const semesterResults = rest.slice(0, SEMESTERS.length);
  const latestRes = rest[SEMESTERS.length];

  const zones: Zone[] = zonesRes.rows.map((r) => ({
    locationId: r.location_id as number,
    locationName: r.location_name as string,
    facilityName: r.facility_name as string | null,
    totalCapacity: r.total_capacity as number | null,
  }));

  const recentReadings: Reading[] = readingsRes.rows.map((r) => ({
    locationId: r.location_id as number,
    count: r.last_count as number,
    recordedAt: r.last_updated_at as string,
  }));

  const recentDates = [...new Set(recentReadings.map((r) => r.recordedAt.slice(0, 10)))]
    .sort()
    .reverse();

  const baselines: HourlyBaseline[] = baselinesRes.rows.map((r) => ({
    locationId: r.location_id as number,
    dayOfWeek: r.day_of_week as number,
    hour: r.hour as number,
    avgCount: r.avg_count as number,
    samples: r.samples as number,
  }));

  const semesterHourly: SemesterHourlyAvg[] = semesterResults.flatMap((res, i) =>
    res.rows.map((r) => ({
      semesterId: SEMESTERS[i].id,
      locationId: r.location_id as number,
      hour: r.hour as number,
      avgCount: r.avg_count as number,
      samples: r.samples as number,
    }))
  );

  const latest: LatestReading[] = latestRes.rows.map((r) => ({
    locationId: r.location_id as number,
    count: r.last_count as number,
    recordedAt: r.last_updated_at as string,
    fetchedAt: r.fetched_at as string,
  }));

  return {
    todayET: today,
    serverNow,
    currentSemesterId: semester.id,
    zones,
    recentDates,
    recentReadings,
    baselines,
    semesterHourly,
    latest,
  };
}
