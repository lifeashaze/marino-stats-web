"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SEMESTERS } from "@/lib/academic-calendar";
import { nowET, type ETParts } from "@/lib/time";
import type { DashboardData, LatestReading, Reading } from "@/lib/queries";
import { Header } from "@/components/dashboard/header";
import { DateSelector } from "@/components/dashboard/date-selector";
import { ZoneChartsSection } from "@/components/dashboard/zone-charts-section";
import { HeatmapSection } from "@/components/dashboard/heatmap-section";
import { SemesterComparisonSection } from "@/components/dashboard/semester-comparison-section";
import {
  buildBaselineLookup,
  buildHeatmapLookup,
  groupZonesByFacility,
} from "@/components/dashboard/zone-utils";

type DashboardProps = {
  data: DashboardData;
};

const FAVORITE_ZONES_STORAGE_KEY = "marino-stats:favorite-zones:v1";

export function Dashboard({ data }: DashboardProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    () => data.recentDates[0] ?? data.todayET
  );

  const zoneGroups = useMemo(() => groupZonesByFacility(data.zones), [data.zones]);
  const validZoneIds = useMemo(
    () => new Set(data.zones.map((zone) => zone.locationId)),
    [data.zones]
  );
  const [favoriteZoneIds, setFavoriteZoneIds] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        const stored = JSON.parse(localStorage.getItem(FAVORITE_ZONES_STORAGE_KEY) ?? "[]");
        if (!Array.isArray(stored)) return;

        setFavoriteZoneIds(
          new Set(
            stored.filter(
              (locationId): locationId is number =>
                typeof locationId === "number" && validZoneIds.has(locationId)
            )
          )
        );
      } catch {
        localStorage.removeItem(FAVORITE_ZONES_STORAGE_KEY);
      }
    }, 0);

    return () => clearTimeout(timeout);
  }, [validZoneIds]);

  const toggleFavoriteZone = useCallback((locationId: number) => {
    setFavoriteZoneIds((current) => {
      const next = new Set(current);
      if (next.has(locationId)) next.delete(locationId);
      else next.add(locationId);
      localStorage.setItem(FAVORITE_ZONES_STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const [heatmapZoneId, setHeatmapZoneId] = useState<number | null>(
    () => zoneGroups[0]?.zones[0]?.locationId ?? null
  );

  // Server-provided "now" keeps hydration consistent (the ISR HTML can be up
  // to 5 min old); corrected on mount and ticked every minute thereafter.
  const [now, setNow] = useState<ETParts>(data.serverNow);
  useEffect(() => {
    const update = () => setNow(nowET());
    const timeout = setTimeout(update, 0); // correct the server-seeded clock just after hydration
    const interval = setInterval(update, 60_000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  // Use the server's semester id so client and ISR-cached HTML agree.
  const semester = SEMESTERS.find((s) => s.id === data.currentSemesterId) ?? SEMESTERS[0];

  const baselineLookup = useMemo(() => buildBaselineLookup(data.baselines), [data.baselines]);
  const heatmapLookup = useMemo(
    () => buildHeatmapLookup(data.recentReadings, data.todayET),
    [data.recentReadings, data.todayET]
  );

  const latestByZone = useMemo(() => {
    const map = new Map<number, LatestReading>();
    for (const l of data.latest) map.set(l.locationId, l);
    return map;
  }, [data.latest]);

  const readingsForDate = useMemo(() => {
    const map = new Map<number, Reading[]>();
    for (const r of data.recentReadings) {
      if (!r.recordedAt.startsWith(selectedDate)) continue;
      if (!map.has(r.locationId)) map.set(r.locationId, []);
      map.get(r.locationId)!.push(r);
    }
    return map;
  }, [data.recentReadings, selectedDate]);

  const [comparisonZoneId, setComparisonZoneId] = useState<number | null>(
    () => zoneGroups[0]?.zones[0]?.locationId ?? null
  );

  const semesterHourlyByZone = useMemo(() => {
    const map = new Map<number, Map<string, Map<number, number>>>();
    for (const s of data.semesterHourly) {
      if (!map.has(s.locationId)) map.set(s.locationId, new Map());
      const bySemester = map.get(s.locationId)!;
      if (!bySemester.has(s.semesterId)) bySemester.set(s.semesterId, new Map());
      bySemester.get(s.semesterId)!.set(s.hour, s.avgCount);
    }
    return map;
  }, [data.semesterHourly]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Header />

        <HeatmapSection
          zoneGroups={zoneGroups}
          selectedZoneId={heatmapZoneId}
          onSelectZone={setHeatmapZoneId}
          heatmapLookup={heatmapLookup}
          semester={semester}
        />

        <DateSelector
          dates={data.recentDates}
          selected={selectedDate}
          onSelect={setSelectedDate}
          todayET={data.todayET}
        />

        <ZoneChartsSection
          zoneGroups={zoneGroups}
          readingsForDate={readingsForDate}
          selectedDate={selectedDate}
          todayET={data.todayET}
          latestByZone={latestByZone}
          baselineLookup={baselineLookup}
          now={now}
          favoriteZoneIds={favoriteZoneIds}
          onToggleFavorite={toggleFavoriteZone}
        />

        <div className="mt-16 border-t border-neutral-200 pt-10 dark:border-neutral-800">
          <SemesterComparisonSection
            zoneGroups={zoneGroups}
            selectedZoneId={comparisonZoneId}
            onSelectZone={setComparisonZoneId}
            semesterHourlyByZone={semesterHourlyByZone}
            semesters={SEMESTERS}
          />
        </div>

        {data.zones.length === 0 && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-12 text-center">
            <p className="text-neutral-500 dark:text-neutral-400">No facility data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
