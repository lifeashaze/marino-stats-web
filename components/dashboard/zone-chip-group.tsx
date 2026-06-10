"use client";

import { getCompactZoneName, type ZoneGroup } from "@/components/dashboard/zone-utils";

type ZoneChipGroupProps = {
  zoneGroups: ZoneGroup[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  ariaLabel: string;
};

export function ZoneChipGroup({ zoneGroups, selectedId, onSelect, ariaLabel }: ZoneChipGroupProps) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="space-y-1.5">
      {zoneGroups.map(({ facilityName, zones }) => (
        <div key={facilityName}>
          <p className="mb-1 text-[9px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {facilityName}
          </p>
          <div className="flex flex-wrap items-center gap-1">
            {zones.map((zone) => {
              const isSelected = selectedId === zone.locationId;
              return (
                <button
                  key={zone.locationId}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onSelect(zone.locationId)}
                  title={zone.locationName}
                  className={[
                    "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] sm:text-xs leading-4 font-medium transition-colors",
                    isSelected
                      ? "border-amber-300/80 bg-amber-100/80 text-amber-700 ring-1 ring-amber-300/60 dark:border-amber-500/60 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/50"
                      : "border-neutral-300/80 bg-neutral-100/90 text-neutral-600 hover:border-neutral-400/80 hover:bg-neutral-200/80 hover:text-neutral-900 dark:border-neutral-700/80 dark:bg-neutral-800/70 dark:text-neutral-400 dark:hover:border-neutral-600/80 dark:hover:bg-neutral-700/70 dark:hover:text-neutral-200",
                  ].join(" ")}
                >
                  <span className="block max-w-[160px] truncate sm:max-w-[220px]">
                    {getCompactZoneName(zone.locationName)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
