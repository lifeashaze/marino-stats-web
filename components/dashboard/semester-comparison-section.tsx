"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
} from "recharts";
import type { Semester } from "@/lib/academic-calendar";
import { formatHourLabel } from "@/lib/time";
import {
  ChartTooltip,
  CHART_TOOLTIP_CURSOR,
  CHART_TOOLTIP_WRAPPER_STYLE,
} from "@/components/dashboard/chart-tooltip";
import { ZoneChipGroup } from "@/components/dashboard/zone-chip-group";
import type { ZoneGroup } from "@/components/dashboard/zone-utils";

type SemesterComparisonSectionProps = {
  zoneGroups: ZoneGroup[];
  selectedZoneId: number | null;
  onSelectZone: (id: number) => void;
  /** zone → semesterId → hour → avgCount */
  semesterHourlyByZone: Map<number, Map<string, Map<number, number>>>;
  semesters: Semester[]; // configured order → stable colors
};

const OPEN_HOURS = Array.from({ length: 19 }, (_, i) => i + 5); // 5 AM - 11 PM
const AVERAGE_FORMATTER = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

type SemesterComparisonTooltipProps = {
  active?: boolean;
  label?: number | string;
  payload?: TooltipProps<number, string>["payload"];
  presentSemesters: Semester[];
  semesters: Semester[];
};

function semesterColor(semesterId: string, semesters: Semester[]) {
  const index = semesters.findIndex((semester) => semester.id === semesterId);
  return `var(--chart-${((index >= 0 ? index : 0) % 5) + 1})`;
}

function SemesterComparisonTooltip({
  active,
  label,
  payload,
  presentSemesters,
  semesters,
}: SemesterComparisonTooltipProps) {
  if (!active || !payload?.length) return null;

  const semesterById = new Map(presentSemesters.map((semester) => [semester.id, semester]));
  const rows = payload
    .filter((item) => typeof item.value === "number" && typeof item.name === "string")
    .sort((a, b) => Number(b.value) - Number(a.value))
    .map((item) => {
      const semesterId = String(item.name);
      return {
        key: semesterId,
        label: semesterById.get(semesterId)?.label ?? semesterId,
        value: AVERAGE_FORMATTER.format(Number(item.value)),
        unit: "people",
        color: semesterColor(semesterId, semesters),
      };
    });

  return (
    <ChartTooltip
      title={formatHourLabel(Number(label))}
      subtitle="Average occupancy"
      rows={rows}
    />
  );
}

export function SemesterComparisonSection({
  zoneGroups,
  selectedZoneId,
  onSelectZone,
  semesterHourlyByZone,
  semesters,
}: SemesterComparisonSectionProps) {
  const zoneData = selectedZoneId != null ? semesterHourlyByZone.get(selectedZoneId) : undefined;
  const presentSemesters = semesters.filter((s) => zoneData?.has(s.id));

  const chartData = OPEN_HOURS.map((hour) => {
    const row: Record<string, number | string> = { hour, label: formatHourLabel(hour) };
    for (const s of presentSemesters) {
      const avg = zoneData?.get(s.id)?.get(hour);
      if (avg !== undefined) row[s.id] = avg;
    }
    return row;
  });

  return (
    <div className="mb-6">
      <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3">
        <div className="flex flex-col gap-2 mb-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight text-neutral-800 dark:text-neutral-200">
              Semester Comparison
            </h3>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400">
              Average occupancy by hour of day, one line per semester. New semesters appear as
              data accumulates.
            </p>
          </div>
          <ZoneChipGroup
            zoneGroups={zoneGroups}
            selectedId={selectedZoneId}
            onSelect={onSelectZone}
            ariaLabel="Select comparison location"
          />
          <div className="flex flex-wrap items-center gap-3">
            {presentSemesters.map((s) => (
              <div
                key={s.id}
                className="inline-flex items-center gap-1.5 text-[11px] text-neutral-600 dark:text-neutral-400"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: `var(--chart-${(semesters.indexOf(s) % 5) + 1})` }}
                />
                {s.label}
              </div>
            ))}
          </div>
        </div>

        <div className="h-56">
          {presentSemesters.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-neutral-200 dark:text-neutral-800"
                  vertical={false}
                />
                <XAxis
                  dataKey="hour"
                  type="number"
                  domain={[5, 23]}
                  ticks={[5, 8, 11, 14, 17, 20, 23]}
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
                />
                <Tooltip
                  content={
                    <SemesterComparisonTooltip
                      presentSemesters={presentSemesters}
                      semesters={semesters}
                    />
                  }
                  cursor={CHART_TOOLTIP_CURSOR}
                  wrapperStyle={CHART_TOOLTIP_WRAPPER_STYLE}
                  offset={12}
                  animationDuration={100}
                />
                {presentSemesters.map((s) => (
                  <Line
                    key={s.id}
                    type="monotone"
                    dataKey={s.id}
                    stroke={`var(--chart-${(semesters.indexOf(s) % 5) + 1})`}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: semesterColor(s.id, semesters),
                      stroke: "var(--card)",
                      strokeWidth: 2,
                    }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-xs text-neutral-400 dark:text-neutral-600">
                No semester data for this zone yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
