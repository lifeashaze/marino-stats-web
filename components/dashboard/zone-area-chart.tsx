"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
} from "recharts";
import { Star } from "lucide-react";
import { CircularProgress } from "@/components/ui/circular-progress";
import {
  ChartTooltip,
  CHART_TOOLTIP_CURSOR,
  CHART_TOOLTIP_WRAPPER_STYLE,
} from "@/components/dashboard/chart-tooltip";
import { formatHourLabel, formatTimeLabel } from "@/lib/time";
import type { LatestReading, Zone } from "@/lib/queries";

export type ChartPoint = {
  hourFraction: number;
  count?: number;
  forecast?: number;
  forecastBridge?: boolean;
  label: string;
};

type ZoneAreaChartProps = {
  zone: Zone;
  points: ChartPoint[];
  isToday: boolean;
  latest?: LatestReading;
  closedReason?: string | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

const AMBER = "rgb(217, 119, 6)";
const COUNT_FORMATTER = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

type ZoneAreaTooltipProps = {
  active?: boolean;
  payload?: TooltipProps<number, string>["payload"];
};

function ZoneAreaTooltip({ active, payload }: ZoneAreaTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload as ChartPoint | undefined;
  const title = String(point?.label ?? "");
  const rows = payload
    .filter(
      (item) =>
        typeof item.value === "number" &&
        typeof item.name === "string" &&
        !(point?.forecastBridge && item.name === "forecast")
    )
    .map((item) => ({
      key: String(item.name),
      label: item.name === "forecast" ? "Forecast" : "Actual",
      value: COUNT_FORMATTER.format(Number(item.value)),
      unit: "people",
      color: AMBER,
    }));

  return <ChartTooltip title={title} subtitle="Occupancy" rows={rows} />;
}

export function ZoneAreaChart({
  zone,
  points,
  isToday,
  latest,
  closedReason,
  isFavorite,
  onToggleFavorite,
}: ZoneAreaChartProps) {
  const values = points.flatMap((p) => [p.count ?? 0, p.forecast ?? 0]);
  const maxDataValue = values.length > 0 ? Math.max(...values) : 0;
  const effectiveMax = zone.totalCapacity
    ? Math.max(zone.totalCapacity, maxDataValue)
    : maxDataValue;

  // Denser ticks in the lower half, where most readings live.
  const generateYAxisTicks = (maxCapacity: number) => {
    const midPoint = Math.floor(maxCapacity / 2);
    const ticks: number[] = [0];
    for (let i = 10; i <= midPoint; i += 10) ticks.push(i);
    for (let i = midPoint + 25; i < maxCapacity; i += 25) ticks.push(i);
    if (ticks[ticks.length - 1] !== maxCapacity) ticks.push(maxCapacity);
    return ticks;
  };
  const yAxisTicks = zone.totalCapacity ? generateYAxisTicks(effectiveMax) : undefined;

  const hourFractions = points.map((p) => p.hourFraction);
  const firstHour = hourFractions.length > 0 ? Math.floor(Math.min(...hourFractions)) : 5;
  const lastHour = hourFractions.length > 0 ? Math.ceil(Math.max(...hourFractions)) : 23;
  const xTicks: number[] = [];
  for (let h = firstHour; h <= lastHour; h += 3) xTicks.push(h);

  const showLastCount = isToday && latest;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5 hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex min-w-0 flex-1 items-start gap-2 pr-2">
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={`${isFavorite ? "Remove" : "Add"} ${zone.locationName} ${
              isFavorite ? "from" : "to"
            } favorites`}
            aria-pressed={isFavorite}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            className={`mt-0.5 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors ${
              isFavorite
                ? "border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400 dark:hover:bg-amber-950"
                : "border-neutral-200 text-neutral-400 hover:border-amber-300 hover:text-amber-600 dark:border-neutral-700 dark:text-neutral-500 dark:hover:border-amber-700 dark:hover:text-amber-400"
            }`}
          >
            <Star className="h-3.5 w-3.5" fill={isFavorite ? "currentColor" : "none"} />
          </button>
          <div className="min-w-0">
            <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100 break-words">
              {zone.locationName}
            </h3>
            {zone.totalCapacity && (
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Capacity: {zone.totalCapacity}
              </div>
            )}
          </div>
        </div>
        {showLastCount && (
          <div className="text-right ml-4">
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
              Last Count
            </div>
            <div className="flex items-center justify-end gap-2">
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-500">
                {latest.count}
              </div>
              {zone.totalCapacity && (
                <CircularProgress value={latest.count} max={zone.totalCapacity} />
              )}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {formatTimeLabel(latest.recordedAt)}
            </div>
          </div>
        )}
      </div>

      <div className="h-40 -mx-2">
        {points.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id={`gradient-${zone.locationId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={AMBER} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={AMBER} stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id={`gradient-forecast-${zone.locationId}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={AMBER} stopOpacity={0.12} />
                  <stop offset="95%" stopColor={AMBER} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-neutral-200 dark:text-neutral-800"
                vertical={false}
              />
              <XAxis
                dataKey="hourFraction"
                type="number"
                domain={["dataMin", "dataMax"]}
                ticks={xTicks}
                tickFormatter={(h: number) => formatHourLabel(h)}
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
                domain={zone.totalCapacity ? [0, effectiveMax] : undefined}
                ticks={yAxisTicks}
              />
              <Tooltip
                content={<ZoneAreaTooltip />}
                cursor={CHART_TOOLTIP_CURSOR}
                wrapperStyle={CHART_TOOLTIP_WRAPPER_STYLE}
                offset={12}
                animationDuration={100}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={AMBER}
                strokeWidth={2}
                fill={`url(#gradient-${zone.locationId})`}
                activeDot={{ r: 4, fill: AMBER, stroke: "var(--card)", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="forecast"
                stroke={AMBER}
                strokeWidth={2}
                strokeDasharray="4 4"
                strokeOpacity={0.7}
                fill={`url(#gradient-forecast-${zone.locationId})`}
                activeDot={{ r: 4, fill: AMBER, stroke: "var(--card)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-neutral-400 dark:text-neutral-600">
              {closedReason ? `Closed — ${closedReason}` : "No data available"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
