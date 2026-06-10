import type { HourlyBaseline, Zone } from "@/lib/queries";

/** Studios are class-driven spaces; busy/quiet verdicts don't apply. */
export const CLASS_DRIVEN_LOCATION_IDS = new Set([9531, 9532]);

export type ZoneGroup = { facilityName: string; zones: Zone[] };

export type BaselineCell = { avg: number; samples: number };
/** zone → day-of-week (0=Sun…6=Sat) → hour → cell */
export type BaselineLookup = Map<number, Map<number, Map<number, BaselineCell>>>;

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

/** Utilization color; callers pass min(utilization, 100) — colors saturate at 100%. */
export const getUtilizationColor = (utilization: number) => {
  if (utilization < 40) return "rgb(34, 197, 94)";
  if (utilization < 70) return "rgb(234, 179, 8)";
  return "rgb(239, 68, 68)";
};
