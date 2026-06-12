"use client";

import { useState, useMemo, Fragment } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { ThemeToggle } from "@/components/theme-toggle";
import { CircularProgress } from "@/components/ui/circular-progress";

type LocationCount = {
  location_id: number;
  last_count: number;
  last_updated_at: string;
  fetched_at: string;
};

type FacilityData = {
  location_id: number;
  location_name: string;
  facility_name: string | null;
  total_capacity?: number;
  counts: LocationCount[];
};

type HeatmapCell = {
  day: number;
  hour: number;
  value: number;
  utilization: number;
  latestAt: number;
};

type HeatmapDayDate = {
  day: number;
  date: Date;
};

type HeatmapData = {
  cells: HeatmapCell[];
  dayDates: HeatmapDayDate[];
};

type ChartPoint = {
  time: number;
  count: number;
  timeLabel: string;
  fullLabel: string;
};

type DashboardProps = {
  initialData: FacilityData[];
};

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getCompactLocationName = (locationName: string) => {
  const parts = locationName.split(/\s*-\s*/);
  if (parts.length <= 1) return locationName;
  const compact = parts.slice(1).join(" - ").trim();
  return compact || locationName;
};

const getHeatmapLocationSortRank = (locationName: string) => {
  const normalized = getCompactLocationName(locationName).toLowerCase();
  if (normalized.includes("3rd floor")) return 0;
  if (normalized.includes("1st floor")) return 1;
  if (normalized.includes("2nd floor")) return 2;
  return 3;
};

const compareLocationsForDisplay = (a: FacilityData, b: FacilityData) => {
  const rankDiff = getHeatmapLocationSortRank(a.location_name) - getHeatmapLocationSortRank(b.location_name);
  if (rankDiff !== 0) return rankDiff;
  return getCompactLocationName(a.location_name).localeCompare(getCompactLocationName(b.location_name));
};

export function Dashboard({ initialData }: DashboardProps) {
  // Compute available dates from all data
  const availableDates = useMemo(() => {
    const allDates = new Set<string>();
    initialData.forEach((facility) => {
      facility.counts.forEach((count) => {
        allDates.add(new Date(count.last_updated_at).toDateString());
      });
    });
    return Array.from(allDates)
      .map((dateStr) => new Date(dateStr))
      .sort((a, b) => b.getTime() - a.getTime())
      .slice(0, 8);
  }, [initialData]);

  // Initialize with default values to avoid hydration mismatch
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    availableDates.length > 0 ? availableDates[0].toISOString() : ""
  );
  const [heatmapLocationId, setHeatmapLocationId] = useState<number | null>(() =>
    initialData.length > 0 ? initialData[0].location_id : null
  );
  const [hoveredCell, setHoveredCell] = useState<{ day: number; hour: number; x: number; y: number } | null>(null);

  // Calculate heatmap data for selected location
  const heatmapData = useMemo<HeatmapData>(() => {
    const location = initialData.find(f => f.location_id === heatmapLocationId);
    if (!location) return { cells: [], dayDates: [] };

    const capacity = location.total_capacity || 100;
    const heatmapMap: { [key: string]: { values: number[]; latestAt: number } } = {};
    const dayDateMap: { [day: number]: { dateKey: string; date: Date } } = {};
    const now = new Date();
    const todayKey = [
      now.getFullYear(),
      (now.getMonth() + 1).toString().padStart(2, "0"),
      now.getDate().toString().padStart(2, "0"),
    ].join("-");

    location.counts.forEach(count => {
      const dateKey = count.last_updated_at.slice(0, 10);
      const date = new Date(`${dateKey}T12:00:00`);
      if (Number.isNaN(date.getTime()) || dateKey >= todayKey) {
        // Only use completed days in the heatmap; skip all of today's readings.
        return;
      }

      const jsDay = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      // Convert to Mon=0, Tue=1, ..., Sun=6
      const day = jsDay === 0 ? 6 : jsDay - 1;

      // Each row represents only the latest completed date for that weekday.
      if (!dayDateMap[day] || dateKey > dayDateMap[day].dateKey) {
        dayDateMap[day] = { dateKey, date };
      }
    });

    location.counts.forEach(count => {
      const dateKey = count.last_updated_at.slice(0, 10);
      const date = new Date(`${dateKey}T12:00:00`);
      if (Number.isNaN(date.getTime())) return;

      const jsDay = date.getDay();
      const day = jsDay === 0 ? 6 : jsDay - 1;
      if (dayDateMap[day]?.dateKey !== dateKey) return;

      const hour = Number(count.last_updated_at.slice(11, 13));
      const timestamp = Date.parse(`${count.last_updated_at}Z`);
      const key = `${day}-${hour}`;
      if (!heatmapMap[key]) {
        heatmapMap[key] = { values: [], latestAt: timestamp };
      }
      heatmapMap[key].values.push(count.last_count);
      if (!Number.isNaN(timestamp)) {
        heatmapMap[key].latestAt = Math.max(heatmapMap[key].latestAt, timestamp);
      }
    });

    const cells: HeatmapCell[] = Object.entries(heatmapMap).map(([key, bucket]) => {
      const [day, hour] = key.split("-").map(Number);
      const avg = bucket.values.reduce((a, b) => a + b, 0) / bucket.values.length;
      return {
        day,
        hour,
        value: avg,
        utilization: (avg / capacity) * 100,
        latestAt: bucket.latestAt,
      };
    });

    const dayDates: HeatmapDayDate[] = Object.entries(dayDateMap).map(([day, { date }]) => ({
      day: parseInt(day, 10),
      date: date,
    }));

    return { cells, dayDates };
  }, [initialData, heatmapLocationId]);

  const getUtilizationColor = (utilization: number) => {
    if (utilization < 40) return "rgb(34, 197, 94)";
    if (utilization < 70) return "rgb(234, 179, 8)";
    return "rgb(239, 68, 68)";
  };

  const formatChartTooltip = (
    value: number | string,
    _name: string | number,
    item: unknown
  ): [number | string, string] => {
    const payload = (item as { payload?: { fullLabel?: string } } | undefined)?.payload;
    return [value, payload?.fullLabel ?? ""];
  };

  // Filter facilities by selected date
  const facilities = useMemo(() => {
    if (!selectedDate) return initialData;

    const filterDate = new Date(selectedDate).toDateString();
    return initialData.map((facility) => ({
      ...facility,
      counts: facility.counts.filter((count) => {
        return new Date(count.last_updated_at).toDateString() === filterDate;
      }),
    }));
  }, [initialData, selectedDate]);

  // Group by facility
  const groupedFacilities = useMemo(() => {
    const groups: { [key: string]: FacilityData[] } = {};
    facilities.forEach((facility) => {
      const key = facility.facility_name || "Other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(facility);
    });
    Object.keys(groups).forEach((key) => {
      groups[key] = [...groups[key]].sort(compareLocationsForDisplay);
    });
    return groups;
  }, [facilities]);

  const heatmapLocationGroups = useMemo<Array<[string, FacilityData[]]>>(() => {
    const groups: { [key: string]: FacilityData[] } = {};
    initialData.forEach((location) => {
      const key = location.facility_name || "Other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(location);
    });
    return Object.entries(groups).map(([facilityName, locations]) => {
      return [facilityName, [...locations].sort(compareLocationsForDisplay)];
    });
  }, [initialData]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-3xl font-semibold leading-tight tracking-tight whitespace-nowrap text-neutral-900 dark:text-neutral-100">
                Northeastern Recreation Capacity Analytics
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                Data source:{" "}
                <a
                  href="https://recreation.northeastern.edu/live-facility-counts/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 dark:text-amber-500 hover:underline"
                >
                  Live Facility Counts
                </a>
              </p>
            </div>
            <div className="shrink-0 pt-0.5">
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Week-Hour Heatmap */}
        <div className="mb-6">
          <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3">
            <div className="flex flex-col gap-2 mb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold tracking-tight text-neutral-800 dark:text-neutral-200">
                    Traffic Heatmap
                  </h3>
                  <p className="mt-0.5 text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400">
                    Historical hourly utilization for completed days only. Today&apos;s data appears after local midnight.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1 text-[9px] sm:text-[10px] text-neutral-600 dark:text-neutral-400">
                  <div className="inline-flex items-center gap-1 rounded-full bg-white/70 px-1.5 py-0.5 dark:bg-neutral-800/70">
                    <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: "rgb(34, 197, 94)" }} />
                    <span>Low</span>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-white/70 px-1.5 py-0.5 dark:bg-neutral-800/70">
                    <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: "rgb(234, 179, 8)" }} />
                    <span>Med</span>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-white/70 px-1.5 py-0.5 dark:bg-neutral-800/70">
                    <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: "rgb(239, 68, 68)" }} />
                    <span>High</span>
                  </div>
                </div>
              </div>
              <div
                role="radiogroup"
                aria-label="Select heatmap location"
                className="space-y-1.5"
              >
                {heatmapLocationGroups.map(([facilityName, locations]) => (
                  <div key={facilityName}>
                    <p className="mb-1 text-[9px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      {facilityName}
                    </p>
                    <div className="flex flex-wrap items-center gap-1">
                      {locations.map((location) => {
                        const isSelected = heatmapLocationId === location.location_id;
                        return (
                          <button
                            key={location.location_id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => setHeatmapLocationId(location.location_id)}
                            title={location.location_name}
                            className={[
                              "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] sm:text-xs leading-4 font-medium transition-colors",
                              isSelected
                                ? "border-amber-300/80 bg-amber-100/80 text-amber-700 ring-1 ring-amber-300/60 dark:border-amber-500/60 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/50"
                                : "border-neutral-300/80 bg-neutral-100/90 text-neutral-600 hover:border-neutral-400/80 hover:bg-neutral-200/80 hover:text-neutral-900 dark:border-neutral-700/80 dark:bg-neutral-800/70 dark:text-neutral-400 dark:hover:border-neutral-600/80 dark:hover:bg-neutral-700/70 dark:hover:text-neutral-200",
                            ].join(" ")}
                          >
                            <span className="block max-w-[160px] truncate sm:max-w-[220px]">
                              {getCompactLocationName(location.location_name)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="grid grid-cols-[auto_repeat(20,1fr)] gap-0.5 sm:gap-1">
                {/* Header row */}
                <div className="sticky left-0 bg-neutral-50 dark:bg-neutral-900/50 z-10"></div>
                {Array.from({ length: 20 }, (_, i) => {
                  const hour = i < 19 ? i + 5 : 0; // 5-23, then 0 (midnight)
                  const hour12 = hour % 12 || 12;
                  const ampm = hour >= 12 ? 'PM' : 'AM';
                  return (
                    <div key={i} className="text-[8px] sm:text-[10px] text-center text-neutral-400 dark:text-neutral-500 pb-0.5 sm:pb-1">
                      <span>{hour12}</span>
                      <span className="hidden lg:inline text-[7px] sm:text-[8px] ml-0.5">{ampm}</span>
                    </div>
                  );
                })}

                {/* Data rows */}
                {DAYS_SHORT.map((day, dayIdx) => {
                  const dayDate = heatmapData.dayDates.find(d => d.day === dayIdx);
                  const dateStr = dayDate
                    ? `${(dayDate.date.getMonth() + 1).toString().padStart(2, '0')}/${dayDate.date.getDate().toString().padStart(2, '0')}`
                    : "";

                  return (
                    <Fragment key={dayIdx}>
                      <div className="sticky left-0 bg-neutral-50 dark:bg-neutral-900/50 z-10 text-[8px] sm:text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center justify-end gap-1.5 pr-2 font-medium whitespace-nowrap">
                        <span className="hidden sm:inline">{dateStr}</span>
                        <span>{day}</span>
                      </div>
                      {Array.from({ length: 20 }, (_, i) => {
                        const hour = i < 19 ? i + 5 : 0; // 5-23, then 0 (midnight)
                        const cell = heatmapData.cells.find(c => c.day === dayIdx && c.hour === hour);
                        const utilization = cell?.utilization || 0;
                        const opacity = Math.max(0.15, utilization / 100);

                        // Show gray for cells with no data
                        const hasData = cell !== undefined;
                        const backgroundColor = hasData
                          ? getUtilizationColor(utilization)
                          : "rgb(163, 163, 163)"; // neutral gray

                        return (
                          <div
                            key={`${dayIdx}-${hour}`}
                            className="h-6 sm:h-7 rounded-sm hover:ring-1 hover:ring-amber-500 transition-all cursor-pointer relative"
                            style={{
                              backgroundColor,
                              opacity: hasData ? opacity : 0.15,
                            }}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoveredCell({
                                day: dayIdx,
                                hour: hour,
                                x: rect.left + rect.width / 2,
                                y: rect.top,
                              });
                            }}
                            onMouseLeave={() => setHoveredCell(null)}
                          />
                        );
                      })}
                    </Fragment>
                  );
                })}
              </div>
            </div>

            {/* Heatmap Tooltip */}
            {hoveredCell && (() => {
              const cell = heatmapData.cells.find(
                c => c.day === hoveredCell.day && c.hour === hoveredCell.hour
              );

              return (
                <div
                  className="fixed z-50 pointer-events-none"
                  style={{
                    left: `${hoveredCell.x}px`,
                    top: `${hoveredCell.y - 10}px`,
                    transform: 'translate(-50%, -100%)',
                  }}
                >
                  <div className="bg-neutral-900 dark:bg-neutral-800 text-white px-3 py-2 rounded-lg shadow-lg border border-neutral-700 dark:border-neutral-600">
                    {cell?.latestAt && cell.latestAt > 0 && (
                      <div className="text-[11px] text-neutral-300 dark:text-neutral-400 mb-0.5">
                        {new Date(cell.latestAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    )}
                    <div className="text-xs font-medium mb-1">
                      {DAYS_SHORT[hoveredCell.day]} {hoveredCell.hour % 12 || 12}
                      {hoveredCell.hour >= 12 ? 'PM' : 'AM'}
                    </div>
                    {cell ? (
                      <>
                        <div
                          className="text-sm font-bold"
                          style={{ color: getUtilizationColor(cell.utilization) }}
                        >
                          {Math.round(cell.utilization)}%
                        </div>
                        <div className="text-xs text-neutral-300 dark:text-neutral-400">
                          {Math.round(cell.value)} people
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-neutral-300 dark:text-neutral-400">
                        No data recorded for this time slot.
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Date Selector */}
        <div className="mb-8">
          <p className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">
            Pick one date to filter all facility charts. Data is limited to the most recent week plus today.
          </p>
          <div
            role="radiogroup"
            aria-label="Select date"
            className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8"
          >
            {availableDates.map((date) => {
              const isoDate = date.toISOString();
              const isSelected = selectedDate === isoDate;
              return (
                <button
                  key={isoDate}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedDate(isoDate)}
                  className={[
                    "cursor-pointer w-full rounded-full px-3 py-1.5 text-center text-xs sm:text-sm font-medium transition-colors",
                    isSelected
                      ? "bg-amber-100/80 text-amber-700 ring-1 ring-amber-300/70 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/50"
                      : "bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900 dark:bg-neutral-800/60 dark:text-neutral-400 dark:hover:bg-neutral-700/70 dark:hover:text-neutral-200",
                  ].join(" ")}
                >
                  {date.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </button>
              );
            })}
          </div>
        </div>

        {/* Facility Groups */}
        <div className="space-y-8">
          {Object.entries(groupedFacilities).map(([facilityName, locations]) => (
            <div key={facilityName}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {facilityName}
                </h2>
                <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  {locations.length} {locations.length === 1 ? "zone" : "zones"}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {locations.map((location) => {
                  const chartData: ChartPoint[] = location.counts
                    .map((count) => ({
                      time: new Date(count.last_updated_at).getTime(),
                      count: count.last_count,
                      timeLabel: new Date(count.last_updated_at).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      }),
                      fullLabel: new Date(count.last_updated_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      }),
                    }))
                    .sort((a, b) => a.time - b.time);

                  const latestCount = chartData.length > 0 ? chartData[chartData.length - 1].count : 0;
                  const lastUpdated = location.counts.length > 0
                    ? new Date(location.counts[location.counts.length - 1].last_updated_at)
                    : null;

                  // Check if last update was today
                  const isToday = lastUpdated
                    ? lastUpdated.toDateString() === new Date().toDateString()
                    : false;

                  // Check if any data exceeds capacity
                  const maxDataValue = chartData.length > 0
                    ? Math.max(...chartData.map(d => d.count))
                    : 0;

                  const effectiveMax = location.total_capacity
                    ? Math.max(location.total_capacity, maxDataValue)
                    : maxDataValue;

                  // Generate custom Y-axis ticks with more density in lower half
                  const generateYAxisTicks = (maxCapacity: number) => {
                    const midPoint = Math.floor(maxCapacity / 2);
                    const ticks: number[] = [0];

                    // Lower half: every 10 units
                    for (let i = 10; i <= midPoint; i += 10) {
                      ticks.push(i);
                    }

                    // Upper half: every 25 units
                    for (let i = midPoint + 25; i < maxCapacity; i += 25) {
                      ticks.push(i);
                    }

                    // Add the max value if not already included
                    if (ticks[ticks.length - 1] !== maxCapacity) {
                      ticks.push(maxCapacity);
                    }

                    return ticks;
                  };

                  const yAxisTicks = location.total_capacity
                    ? generateYAxisTicks(effectiveMax)
                    : undefined;

                  return (
                    <div
                      key={location.location_id}
                      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 pr-2">
                          <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100 break-words">
                            {location.location_name}
                          </h3>
                          {location.total_capacity && (
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                              Capacity: {location.total_capacity}
                            </div>
                          )}
                        </div>
                        {isToday && location.total_capacity && (
                          <div className="text-right ml-4">
                            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                              Last Count
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <div className="text-3xl font-bold text-amber-600 dark:text-amber-500">
                                {latestCount}
                              </div>
                              <CircularProgress
                                value={latestCount}
                                max={location.total_capacity}
                              />
                            </div>
                            {lastUpdated && (
                              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                {lastUpdated.toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </div>
                            )}
                          </div>
                        )}
                        {isToday && !location.total_capacity && (
                          <div className="text-right ml-4">
                            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                              Last Count
                            </div>
                            <div className="text-3xl font-bold text-amber-600 dark:text-amber-500">
                              {latestCount}
                            </div>
                            {lastUpdated && (
                              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                {lastUpdated.toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="h-40 -mx-2">
                        {chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                              <defs>
                                <linearGradient id={`gradient-${location.location_id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="rgb(217, 119, 6)" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="rgb(217, 119, 6)" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="currentColor"
                                className="text-neutral-200 dark:text-neutral-800"
                                vertical={false}
                              />
                              <XAxis
                                dataKey="timeLabel"
                                tick={{ fontSize: 10 }}
                                stroke="currentColor"
                                className="text-neutral-400 dark:text-neutral-600"
                                tickLine={false}
                                axisLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 10 }}
                                stroke="currentColor"
                                className="text-neutral-400 dark:text-neutral-600"
                                tickLine={false}
                                axisLine={false}
                                width={30}
                                domain={location.total_capacity ? [0, effectiveMax] : undefined}
                                ticks={yAxisTicks}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "rgb(255, 255, 255)",
                                  border: "1px solid rgb(229, 229, 229)",
                                  borderRadius: "8px",
                                  padding: "8px 12px",
                                  fontSize: "12px",
                                }}
                                labelStyle={{ display: "none" }}
                                itemStyle={{ color: "rgb(217, 119, 6)", fontWeight: "600" }}
                                formatter={formatChartTooltip}
                              />
                              <Area
                                type="monotone"
                                dataKey="count"
                                stroke="rgb(217, 119, 6)"
                                strokeWidth={2}
                                fill={`url(#gradient-${location.location_id})`}
                                activeDot={{ r: 4, fill: "rgb(217, 119, 6)" }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <p className="text-xs text-neutral-400 dark:text-neutral-600">No data available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {facilities.length === 0 && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-12 text-center">
            <p className="text-neutral-500 dark:text-neutral-400">No facility data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
