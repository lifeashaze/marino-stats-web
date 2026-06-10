"use client";

import { useEffect, useMemo, useState } from "react";
import { SEMESTERS, weekOfSemester } from "@/lib/academic-calendar";
import { nowET, type ETParts } from "@/lib/time";
import type { DashboardData, LatestReading, Reading } from "@/lib/queries";
import { Header } from "@/components/dashboard/header";
import { GoNowSection } from "@/components/dashboard/go-now-section";
import { DateSelector } from "@/components/dashboard/date-selector";
import { ZoneChartsSection } from "@/components/dashboard/zone-charts-section";
import { HeatmapSection } from "@/components/dashboard/heatmap-section";
import { buildBaselineLookup, groupZonesByFacility } from "@/components/dashboard/zone-utils";

type DashboardProps = {
  data: DashboardData;
};

export function Dashboard({ data }: DashboardProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    () => data.recentDates[0] ?? data.todayET
  );

  const zoneGroups = useMemo(() => groupZonesByFacility(data.zones), [data.zones]);

  const [heatmapZoneId, setHeatmapZoneId] = useState<number | null>(
    () => zoneGroups[0]?.zones[0]?.locationId ?? null
  );

  // Server-provided "now" keeps hydration consistent (the ISR HTML can be up
  // to 5 min old); corrected on mount and ticked every minute thereafter.
  const [now, setNow] = useState<ETParts>(data.serverNow);
  useEffect(() => {
    setNow(nowET());
    const interval = setInterval(() => setNow(nowET()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Use the server's semester id so client and ISR-cached HTML agree.
  const semester = SEMESTERS.find((s) => s.id === data.currentSemesterId) ?? SEMESTERS[0];

  const baselineLookup = useMemo(() => buildBaselineLookup(data.baselines), [data.baselines]);

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

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Header
          semesterLabel={semester.label}
          weekNumber={weekOfSemester(data.todayET, semester)}
        />

        <GoNowSection
          zoneGroups={zoneGroups}
          latestByZone={latestByZone}
          baselineLookup={baselineLookup}
          now={now}
          todayET={data.todayET}
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
        />

        <div className="mt-8">
          <HeatmapSection
            zoneGroups={zoneGroups}
            selectedZoneId={heatmapZoneId}
            onSelectZone={setHeatmapZoneId}
            baselineLookup={baselineLookup}
            semester={semester}
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
