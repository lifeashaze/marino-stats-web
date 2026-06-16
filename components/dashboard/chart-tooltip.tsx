"use client";

import type { ReactNode } from "react";

export const CHART_TOOLTIP_CURSOR = {
  stroke: "var(--border)",
  strokeWidth: 1,
  strokeDasharray: "3 3",
};

export const CHART_TOOLTIP_WRAPPER_STYLE = {
  outline: "none",
  pointerEvents: "none" as const,
};

export type ChartTooltipRow = {
  key: string;
  label: string;
  value: ReactNode;
  unit?: string;
  color?: string;
};

type ChartTooltipProps = {
  title: string;
  subtitle?: string;
  rows?: ChartTooltipRow[];
  message?: string;
};

export function ChartTooltip({ title, subtitle, rows = [], message }: ChartTooltipProps) {
  return (
    <div className="min-w-48 rounded-lg border border-neutral-200 bg-white/95 p-2.5 shadow-lg backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-900/95">
      <div className="mb-2 border-b border-neutral-100 pb-2 dark:border-neutral-800">
        <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">{title}</div>
        {subtitle ? (
          <div className="mt-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">
            {subtitle}
          </div>
        ) : null}
      </div>
      {message ? (
        <div className="text-[11px] text-neutral-600 dark:text-neutral-300">{message}</div>
      ) : (
        <div className="space-y-1.5">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-2">
                {row.color ? (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                ) : null}
                <span className="truncate text-[11px] text-neutral-600 dark:text-neutral-300">
                  {row.label}
                </span>
              </div>
              <div className="shrink-0 text-right text-xs font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                {row.value}
                {row.unit ? (
                  <span className="ml-1 text-[9px] font-normal text-neutral-400">{row.unit}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
