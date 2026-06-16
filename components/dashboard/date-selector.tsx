"use client";

import { formatDateLabel } from "@/lib/time";

type DateSelectorProps = {
  dates: string[];
  selected: string;
  onSelect: (date: string) => void;
  todayET: string;
};

export function DateSelector({
  dates,
  selected,
  onSelect,
  todayET,
}: DateSelectorProps) {
  return (
    <div className="mb-8">
      <p className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">
        Pick one date to filter all facility charts. Data is limited to the most recent week plus
        today.
      </p>
      <div
        role="radiogroup"
        aria-label="Select date"
        className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8"
      >
        {dates.map((date) => {
          const isSelected = selected === date;
          return (
            <button
              key={date}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(date)}
              className={[
                "cursor-pointer w-full rounded-full px-3 py-1.5 text-center text-xs sm:text-sm font-medium transition-colors",
                isSelected
                  ? "bg-amber-100/80 text-amber-700 ring-1 ring-amber-300/70 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/50"
                  : "bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900 dark:bg-neutral-800/60 dark:text-neutral-400 dark:hover:bg-neutral-700/70 dark:hover:text-neutral-200",
              ].join(" ")}
            >
              {date === todayET ? "Today" : formatDateLabel(date)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
