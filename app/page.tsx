"use client";

import { useEffect, useState, useMemo } from "react";
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
  total_capacity?: number; // Optional for now, will be required once backend is updated
  counts: LocationCount[];
};

export default function Page() {
  const [allFacilities, setAllFacilities] = useState<FacilityData[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch all data once on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/facilities?date=all`);
        if (!response.ok) throw new Error("Failed to fetch data");
        const data = await response.json();
        setAllFacilities(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Compute available dates from all data
  const availableDates = useMemo(() => {
    const allDates = new Set<string>();
    allFacilities.forEach((facility) => {
      facility.counts.forEach((count) => {
        allDates.add(new Date(count.last_updated_at).toDateString());
      });
    });
    return Array.from(allDates)
      .map((dateStr) => new Date(dateStr))
      .sort((a, b) => b.getTime() - a.getTime())
      .slice(0, 7);
  }, [allFacilities]);

  // Set the most recent date as default when data is first loaded
  useEffect(() => {
    if (!selectedDate && availableDates.length > 0) {
      setSelectedDate(availableDates[0].toISOString());
    }
  }, [availableDates, selectedDate]);

  // Filter facilities by selected date
  const facilities = useMemo(() => {
    if (!selectedDate) return allFacilities;

    const filterDate = new Date(selectedDate).toDateString();
    return allFacilities.map((facility) => ({
      ...facility,
      counts: facility.counts.filter((count) => {
        return new Date(count.last_updated_at).toDateString() === filterDate;
      }),
    }));
  }, [allFacilities, selectedDate]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-neutral-200 dark:border-neutral-800 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin" />
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a] p-4">
        <div className="bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-900 rounded-xl p-8 max-w-md">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Error</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
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

            <div className="flex items-center gap-3">
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

              <ThemeToggle />
            </div>
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
