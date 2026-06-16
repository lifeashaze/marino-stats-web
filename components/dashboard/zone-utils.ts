import { dayOfWeekOf } from "@/lib/time";
import type { HourlyBaseline, Reading, Zone } from "@/lib/queries";

export type ZoneGroup = { facilityName: string; zones: Zone[] };

export type BaselineCell = { avg: number; samples: number };
/** zone → day-of-week (0=Sun…6=Sat) → hour → cell */
export type BaselineLookup = Map<number, Map<number, Map<number, BaselineCell>>>;
export type HeatmapCell = BaselineCell & { date: string };
/** zone → day-of-week (0=Sun…6=Sat) → hour → latest completed-day cell */
export type HeatmapLookup = Map<number, Map<number, Map<number, HeatmapCell>>>;

export const getCompactZoneName = (locationName: string) => {
  const parts = locationName.split(/\s*-\s*/);
  if (parts.length <= 1) return locationName;
  const compact = parts.slice(1).join(" - ").trim();
  return compact || locationName;
};

const getZoneSortRank = (locationName: string) => {
  const normalized = getCompactZoneName(locationName).toLowerCase();
  if (normalized.includes("3rd floor")) return 0;
  if (normalized.includes("1st floor")) return 1;
  if (normalized.includes("2nd floor")) return 2;
  return 3;
};

export const compareZonesForDisplay = (a: Zone, b: Zone) => {
  const rankDiff = getZoneSortRank(a.locationName) - getZoneSortRank(b.locationName);
  if (rankDiff !== 0) return rankDiff;
  return getCompactZoneName(a.locationName).localeCompare(getCompactZoneName(b.locationName));
};

export function groupZonesByFacility(zones: Zone[]): ZoneGroup[] {
  const groups = new Map<string, Zone[]>();
  for (const zone of zones) {
    const key = zone.facilityName || "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(zone);
  }
  return [...groups.entries()].map(([facilityName, members]) => ({
    facilityName,
    zones: [...members].sort(compareZonesForDisplay),
  }));
}

export function buildBaselineLookup(baselines: HourlyBaseline[]): BaselineLookup {
  const lookup: BaselineLookup = new Map();
  for (const b of baselines) {
    if (!lookup.has(b.locationId)) lookup.set(b.locationId, new Map());
    const byDay = lookup.get(b.locationId)!;
    if (!byDay.has(b.dayOfWeek)) byDay.set(b.dayOfWeek, new Map());
    byDay.get(b.dayOfWeek)!.set(b.hour, { avg: b.avgCount, samples: b.samples });
  }
  return lookup;
}

export function buildHeatmapLookup(readings: Reading[], today: string): HeatmapLookup {
  const lookup: HeatmapLookup = new Map();
  const latestDateByZoneDay = new Map<string, string>();

  for (const reading of readings) {
    const date = reading.recordedAt.slice(0, 10);
    if (date >= today) continue;
    const key = `${reading.locationId}-${dayOfWeekOf(date)}`;
    const latest = latestDateByZoneDay.get(key);
    if (!latest || date > latest) latestDateByZoneDay.set(key, date);
  }

  const buckets = new Map<string, { sum: number; samples: number; date: string }>();
  for (const reading of readings) {
    const date = reading.recordedAt.slice(0, 10);
    const dayOfWeek = dayOfWeekOf(date);
    if (latestDateByZoneDay.get(`${reading.locationId}-${dayOfWeek}`) !== date) continue;
    const hour = Number(reading.recordedAt.slice(11, 13));
    const key = `${reading.locationId}-${dayOfWeek}-${hour}`;
    const bucket = buckets.get(key) ?? { sum: 0, samples: 0, date };
    bucket.sum += reading.count;
    bucket.samples += 1;
    buckets.set(key, bucket);
  }

  for (const [key, bucket] of buckets) {
    const [locationId, dayOfWeek, hour] = key.split("-").map(Number);
    if (!lookup.has(locationId)) lookup.set(locationId, new Map());
    const byDay = lookup.get(locationId)!;
    if (!byDay.has(dayOfWeek)) byDay.set(dayOfWeek, new Map());
    byDay.get(dayOfWeek)!.set(hour, {
      avg: bucket.sum / bucket.samples,
      samples: bucket.samples,
      date: bucket.date,
    });
  }
  return lookup;
}

/** Utilization color; callers pass min(utilization, 100) — colors saturate at 100%. */
export const getUtilizationColor = (utilization: number) => {
  if (utilization < 40) return "rgb(34, 197, 94)";
  if (utilization < 70) return "rgb(234, 179, 8)";
  return "#C8102E";
};
