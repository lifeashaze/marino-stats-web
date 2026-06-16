"use client";

import { isClosed } from "@/lib/academic-calendar";
import { buildForecast } from "@/lib/forecast";
import { etHourFraction, formatHourLabel, formatTimeLabel, type ETParts } from "@/lib/time";
import type { LatestReading, Reading, Zone } from "@/lib/queries";
import { ZoneAreaChart, type ChartPoint } from "@/components/dashboard/zone-area-chart";
import type { BaselineLookup, ZoneGroup } from "@/components/dashboard/zone-utils";

type ZoneChartsSectionProps = {
  zoneGroups: ZoneGroup[];
  readingsForDate: Map<number, Reading[]>;
  selectedDate: string;
  todayET: string;
  latestByZone: Map<number, LatestReading>;
  baselineLookup: BaselineLookup;
  now: ETParts;
  favoriteZoneIds: Set<number>;
  onToggleFavorite: (locationId: number) => void;
};

type ZoneChartProps = Omit<ZoneChartsSectionProps, "zoneGroups"> & {
  zone: Zone;
};

function ZoneChart({
  zone,
  readingsForDate,
  selectedDate,
  todayET,
  latestByZone,
  baselineLookup,
  now,
  favoriteZoneIds,
  onToggleFavorite,
}: ZoneChartProps) {
  const isToday = selectedDate === todayET;
  const readings = readingsForDate.get(zone.locationId) ?? [];
  const points: ChartPoint[] = readings.map((r) => ({
    hourFraction: etHourFraction(r.recordedAt),
    count: r.count,
    label: formatTimeLabel(r.recordedAt),
  }));

  if (isToday && points.length > 0) {
    const dayBaselines = baselineLookup.get(zone.locationId)?.get(now.dayOfWeek);
    const baselineByHour = new Map<number, number>();
    for (const [hour, cell] of dayBaselines ?? []) baselineByHour.set(hour, cell.avg);

    const forecast = buildForecast({
      todayPoints: points.map((p) => ({
        hourFraction: p.hourFraction,
        count: p.count!,
      })),
      baselineByHour,
      nowHourFraction: now.hour + now.minute / 60,
    });

    if (forecast) {
      // Bridge point so the dashed line connects to the last actual.
      const last = points[points.length - 1];
      last.forecast = last.count;
      last.forecastBridge = true;
      for (const fp of forecast.points) {
        points.push({
          hourFraction: fp.hourFraction,
          forecast: fp.forecast,
          label: `${formatHourLabel(fp.hourFraction)} (expected)`,
        });
      }
    }
  }

  return (
    <ZoneAreaChart
      zone={zone}
      points={points}
      isToday={isToday}
      latest={latestByZone.get(zone.locationId)}
      closedReason={points.length === 0 ? isClosed(zone.facilityName, selectedDate) : null}
      isFavorite={favoriteZoneIds.has(zone.locationId)}
      onToggleFavorite={() => onToggleFavorite(zone.locationId)}
    />
  );
}

export function ZoneChartsSection({
  zoneGroups,
  readingsForDate,
  selectedDate,
  todayET,
  latestByZone,
  baselineLookup,
  now,
  favoriteZoneIds,
  onToggleFavorite,
}: ZoneChartsSectionProps) {
  const favoriteZones = zoneGroups
    .flatMap(({ zones }) => zones)
    .filter((zone) => favoriteZoneIds.has(zone.locationId));
  const chartProps = {
    readingsForDate,
    selectedDate,
    todayET,
    latestByZone,
    baselineLookup,
    now,
    favoriteZoneIds,
    onToggleFavorite,
  };

  return (
    <div className="space-y-10">
      {favoriteZones.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm dark:border-amber-500/20 dark:from-amber-500/10 dark:to-neutral-950">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                Pinned zones
              </p>
              <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
                Your favorites
              </h2>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {favoriteZones.length} {favoriteZones.length === 1 ? "zone" : "zones"} pinned on
              this browser
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {favoriteZones.map((zone) => (
              <ZoneChart key={zone.locationId} zone={zone} {...chartProps} />
            ))}
          </div>
        </div>
      ) : null}

      {zoneGroups.map(({ facilityName, zones }) => {
        const unpinnedZones = zones.filter((zone) => !favoriteZoneIds.has(zone.locationId));
        if (unpinnedZones.length === 0) return null;

        return (
          <div key={facilityName}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {facilityName}
              </h2>
              <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {unpinnedZones.length} {unpinnedZones.length === 1 ? "zone" : "zones"}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {unpinnedZones.map((zone) => (
                <ZoneChart key={zone.locationId} zone={zone} {...chartProps} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
