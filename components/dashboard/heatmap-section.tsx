"use client";

import { Fragment, useState } from "react";
import { isClosedOnDayOfWeek, type Semester } from "@/lib/academic-calendar";
import { ZoneChipGroup } from "@/components/dashboard/zone-chip-group";
import {
  getUtilizationColor,
  type BaselineLookup,
  type ZoneGroup,
} from "@/components/dashboard/zone-utils";

type HeatmapSectionProps = {
  zoneGroups: ZoneGroup[];
  selectedZoneId: number | null;
  onSelectZone: (id: number) => void;
  baselineLookup: BaselineLookup;
  semester: Semester;
};

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// Columns: 5 AM–11 PM, then midnight. Hour-0 readings carry the *next* day's
// date/dow, so the midnight cell at the end of row X is X's 12 AM close-out.
const HOURS = [...Array.from({ length: 19 }, (_, i) => i + 5), 0];

type HoveredCell = { rowIdx: number; hour: number; x: number; y: number };

export function HeatmapSection({
  zoneGroups,
  selectedZoneId,
  onSelectZone,
  baselineLookup,
  semester,
}: HeatmapSectionProps) {
  const [hoveredCell, setHoveredCell] = useState<HoveredCell | null>(null);

  const selectedZone = zoneGroups
    .flatMap((g) => g.zones)
    .find((z) => z.locationId === selectedZoneId);
  const capacity = selectedZone?.totalCapacity || 100;
  const zoneBaselines = selectedZoneId != null ? baselineLookup.get(selectedZoneId) : undefined;
  const hasAnyData = zoneBaselines !== undefined && zoneBaselines.size > 0;

  const closedRuleForRow = (rowIdx: number) =>
    isClosedOnDayOfWeek(selectedZone?.facilityName ?? null, semester, (rowIdx + 1) % 7);

  const cellFor = (rowIdx: number, hour: number) =>
    zoneBaselines?.get((rowIdx + 1) % 7)?.get(hour);

  return (
    <div className="mb-6">
      <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3">
        <div className="flex flex-col gap-2 mb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold tracking-tight text-neutral-800 dark:text-neutral-200">
                Traffic Heatmap
              </h3>
              <p className="mt-0.5 text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400">
                Average occupancy by hour · {semester.label} to date · excludes today and closures.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1 text-[9px] sm:text-[10px] text-neutral-600 dark:text-neutral-400">
              {[
                ["Low", "rgb(34, 197, 94)"],
                ["Med", "rgb(234, 179, 8)"],
                ["High", "rgb(239, 68, 68)"],
              ].map(([label, color]) => (
                <div
                  key={label}
                  className="inline-flex items-center gap-1 rounded-full bg-white/70 px-1.5 py-0.5 dark:bg-neutral-800/70"
                >
                  <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <ZoneChipGroup
            zoneGroups={zoneGroups}
            selectedId={selectedZoneId}
            onSelect={onSelectZone}
            ariaLabel="Select heatmap location"
          />
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-cols-[auto_repeat(20,1fr)] gap-0.5 sm:gap-1">
            <div className="sticky left-0 bg-neutral-50 dark:bg-neutral-900/50 z-10"></div>
            {HOURS.map((hour) => {
              const hour12 = hour % 12 || 12;
              const ampm = hour >= 12 ? "PM" : "AM";
              return (
                <div
                  key={hour}
                  className="text-[8px] sm:text-[10px] text-center text-neutral-400 dark:text-neutral-500 pb-0.5 sm:pb-1"
                >
                  <span>{hour12}</span>
                  <span className="hidden lg:inline text-[7px] sm:text-[8px] ml-0.5">{ampm}</span>
                </div>
              );
            })}

            {DAYS_SHORT.map((day, rowIdx) => {
              const closedRule = closedRuleForRow(rowIdx);
              return (
                <Fragment key={day}>
                  <div className="sticky left-0 bg-neutral-50 dark:bg-neutral-900/50 z-10 text-[8px] sm:text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center justify-end pr-2 font-medium whitespace-nowrap">
                    {day}
                  </div>
                  {HOURS.map((hour) => {
                    const cell = cellFor(rowIdx, hour);
                    const utilization = cell ? (cell.avg / capacity) * 100 : 0;
                    const colorUtilization = Math.min(utilization, 100);

                    let backgroundColor = "rgb(163, 163, 163)";
                    let opacity = 0.15;
                    let backgroundImage: string | undefined;
                    if (closedRule) {
                      backgroundImage =
                        "repeating-linear-gradient(45deg, rgba(163,163,163,0.35) 0 3px, transparent 3px 6px)";
                      opacity = 0.5;
                      backgroundColor = "transparent";
                    } else if (cell) {
                      backgroundColor = getUtilizationColor(colorUtilization);
                      opacity = Math.max(0.15, colorUtilization / 100);
                    }

                    return (
                      <div
                        key={`${rowIdx}-${hour}`}
                        className="h-6 sm:h-7 rounded-sm hover:ring-1 hover:ring-amber-500 transition-all cursor-pointer relative"
                        style={{ backgroundColor, opacity, backgroundImage }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredCell({
                            rowIdx,
                            hour,
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

        {!hasAnyData && (
          <p className="mt-2 text-center text-xs text-neutral-400 dark:text-neutral-600">
            Not enough {semester.label} data yet.
          </p>
        )}

        {hoveredCell &&
          (() => {
            const closedRule = closedRuleForRow(hoveredCell.rowIdx);
            const cell = cellFor(hoveredCell.rowIdx, hoveredCell.hour);
            const utilization = cell ? (cell.avg / capacity) * 100 : 0;
            const hour12 = hoveredCell.hour % 12 || 12;
            const ampm = hoveredCell.hour >= 12 ? "PM" : "AM";

            return (
              <div
                className="fixed z-50 pointer-events-none"
                style={{
                  left: `${hoveredCell.x}px`,
                  top: `${hoveredCell.y - 10}px`,
                  transform: "translate(-50%, -100%)",
                }}
              >
                <div className="bg-neutral-900 dark:bg-neutral-800 text-white px-3 py-2 rounded-lg shadow-lg border border-neutral-700 dark:border-neutral-600">
                  <div className="text-xs font-medium mb-1">
                    {DAYS_SHORT[hoveredCell.rowIdx]} {hour12}
                    {ampm}
                  </div>
                  {closedRule ? (
                    <div className="text-xs text-neutral-300 dark:text-neutral-400">
                      Closed — {closedRule.reason}
                    </div>
                  ) : cell ? (
                    <>
                      <div
                        className="text-sm font-bold"
                        style={{ color: getUtilizationColor(Math.min(utilization, 100)) }}
                      >
                        {Math.round(utilization)}%
                      </div>
                      <div className="text-xs text-neutral-300 dark:text-neutral-400">
                        {Math.round(cell.avg)} people avg · {cell.samples} readings
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
  );
}
