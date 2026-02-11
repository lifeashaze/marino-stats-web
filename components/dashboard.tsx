"use client";

import { useState, useMemo, useEffect, Fragment } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";

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
};

type DashboardProps = {
  initialData: FacilityData[];
};

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function Dashboard({ initialData }: DashboardProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [heatmapLocationId, setHeatmapLocationId] = useState<number | null>(null);

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
      .slice(0, 7);
  }, [initialData]);

  // Set the most recent date as default when data is first loaded
  useEffect(() => {
    if (!selectedDate && availableDates.length > 0) {
      setSelectedDate(availableDates[0].toISOString());
    }
  }, [availableDates, selectedDate]);

  // Set default heatmap location
  useEffect(() => {
    if (heatmapLocationId === null && initialData.length > 0) {
      setHeatmapLocationId(initialData[0].location_id);
    }
  }, [heatmapLocationId, initialData]);

  // Calculate heatmap data for selected location
  const heatmapData = useMemo(() => {
    const location = initialData.find(f => f.location_id === heatmapLocationId);
    if (!location) return { cells: [], dayDates: [] };

    const capacity = location.total_capacity || 100;
    const heatmapMap: { [key: string]: number[] } = {};
    const dayDateMap: { [day: number]: Date } = {};

    location.counts.forEach(count => {
      const date = new Date(count.last_updated_at);
      const day = date.getDay();
      const hour = date.getHours();
      const key = `${day}-${hour}`;
      if (!heatmapMap[key]) heatmapMap[key] = [];
      heatmapMap[key].push(count.last_count);

      // Keep track of the most recent date for each day of week
      if (!dayDateMap[day] || date > dayDateMap[day]) {
        dayDateMap[day] = date;
      }
    });

    const cells = Object.entries(heatmapMap).map(([key, values]) => {
      const [day, hour] = key.split("-").map(Number);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return {
        day,
        hour,
        value: avg,
        utilization: (avg / capacity) * 100,
      };
    });

    const dayDates = Object.entries(dayDateMap).map(([day, date]) => ({
      day: parseInt(day),
      date: date,
    }));

    return { cells, dayDates };
  }, [initialData, heatmapLocationId]);

  const getUtilizationColor = (utilization: number) => {
    if (utilization < 40) return "rgb(34, 197, 94)";
    if (utilization < 70) return "rgb(234, 179, 8)";
    return "rgb(239, 68, 68)";
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
    return groups;
  }, [facilities]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100">
                Northeastern Recreation Capacity Analytics
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-2">
                Data source:{" "}
                <a
                  href="https://recreation.northeastern.edu/live-facility-counts/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 dark:text-amber-500 hover:underline"
                >
                  Northeastern Recreation Live Facility Counts
                </a>
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Week-Hour Heatmap */}
        <div className="mb-6">
          <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3">
            <div className="flex flex-col gap-2 mb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Traffic Heatmap</h3>
                <div className="flex items-center gap-2 text-[10px] text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: "rgb(34, 197, 94)" }} />
                    <span className="hidden sm:inline">Low</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: "rgb(234, 179, 8)" }} />
                    <span className="hidden sm:inline">Med</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: "rgb(239, 68, 68)" }} />
                    <span className="hidden sm:inline">High</span>
                  </div>
                </div>
              </div>
              <Select
                value={heatmapLocationId?.toString() || ""}
                onValueChange={(value) => value && setHeatmapLocationId(parseInt(value))}
              >
                <SelectTrigger className="w-full sm:w-64 h-8 text-xs bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                  <SelectValue>
                    {initialData.find(loc => loc.location_id === heatmapLocationId)?.location_name || "Select location"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                  {initialData.map((location) => (
                    <SelectItem key={location.location_id} value={location.location_id.toString()}>
                      {location.location_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <div className="grid grid-cols-[auto_repeat(20,1fr)] gap-0.5 sm:gap-1">
                {/* Header row */}
                <div className="sticky left-0 bg-neutral-50 dark:bg-neutral-900/50 z-10"></div>
                {Array.from({ length: 20 }, (_, i) => {
                  const hour = i < 19 ? i + 5 : 0; // 5-23, then 0 (midnight)
                  return (
                    <div key={i} className="text-[8px] sm:text-[10px] text-center text-neutral-400 dark:text-neutral-500 pb-0.5 sm:pb-1">
                      {hour % 12 || 12}
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

                        return (
                          <div
                            key={`${dayIdx}-${hour}`}
                            className="h-6 sm:h-7 rounded-sm hover:ring-1 hover:ring-amber-500 transition-all cursor-pointer"
                            style={{
                              backgroundColor: getUtilizationColor(utilization),
                              opacity: opacity,
                            }}
                            title={`${day} ${hour % 12 || 12}${hour >= 12 ? 'PM' : 'AM'} - ${Math.round(utilization)}% (${Math.round(cell?.value || 0)} people)`}
                          />
                        );
                      })}
                    </Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="mb-8">
          <Select value={selectedDate} onValueChange={(value) => setSelectedDate(value || "")}>
            <SelectTrigger className="w-full sm:w-56 h-10 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
              <SelectValue>
                {selectedDate
                  ? new Date(selectedDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  : "Select a date"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
              {availableDates.map((date) => (
                <SelectItem key={date.toISOString()} value={date.toISOString()}>
                  {date.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  const chartData = location.counts
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
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {location.location_name}
                          </h3>
                          {location.total_capacity && (
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                              Capacity: {location.total_capacity}
                            </div>
                          )}
                        </div>
                        {isToday && (
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
                                formatter={(value: any, name: any, props: any) => [
                                  value,
                                  props.payload.fullLabel,
                                ]}
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
