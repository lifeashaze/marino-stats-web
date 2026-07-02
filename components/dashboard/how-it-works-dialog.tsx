"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { CircleHelp, X } from "lucide-react";
import { pillLinkClass } from "@/components/dashboard/pill-link";

/* Matches getUtilizationColor in zone-utils.ts; keep in sync. */
const SCALE = [
  { label: "Quiet", range: "under 40%", color: "rgb(34, 197, 94)", width: "40%" },
  { label: "Moderate", range: "40–70%", color: "rgb(234, 179, 8)", width: "30%" },
  { label: "Busy", range: "over 70%", color: "#C8102E", width: "30%" },
] as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a4804a] dark:text-[#c8a978]">
      {children}
    </p>
  );
}

function PipelineStep({
  title,
  last,
  children,
}: {
  title: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="relative pl-6 pb-5 last:pb-0">
      {!last ? (
        <span
          aria-hidden
          className="absolute left-[3.5px] top-4 bottom-0 w-px bg-neutral-200 dark:bg-neutral-800"
        />
      ) : null}
      <span
        aria-hidden
        className={`absolute left-0 top-1.5 h-2 w-2 rounded-full ${
          last
            ? "bg-[#C8102E] dark:bg-[#ff4f68]"
            : "border border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-950"
        }`}
      />
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        {children}
      </p>
    </li>
  );
}

/** Illustrative day curve: solid = today so far, dashed = forecast,
 * dotted = the weekday baseline the forecast is built from. */
function ForecastFigure() {
  return (
    <figure className="mt-4">
      <svg
        viewBox="0 0 320 104"
        className="h-auto w-full"
        role="img"
        aria-label="Example chart: a solid line for today so far, continued by a dashed forecast line that follows the shape of a dotted weekday-average line"
      >
        {/* floor */}
        <line
          x1="12"
          y1="92"
          x2="308"
          y2="92"
          className="stroke-neutral-200 dark:stroke-neutral-800"
          strokeWidth="1"
        />
        {/* weekday baseline */}
        <polyline
          points="12,82 48,60 84,68 120,60 156,52 192,46 228,30 264,40 308,74"
          fill="none"
          strokeWidth="1.5"
          strokeDasharray="1.5 4.5"
          strokeLinecap="round"
          className="stroke-neutral-400 dark:stroke-neutral-500"
        />
        {/* today so far: area + line */}
        <polygon
          points="12,80 48,55 84,64 120,55 156,46 156,92 12,92"
          className="fill-[#C8102E]/8 dark:fill-[#ff4f68]/10"
        />
        <polyline
          points="12,80 48,55 84,64 120,55 156,46"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          className="stroke-[#C8102E] dark:stroke-[#ff4f68]"
        />
        {/* now marker */}
        <line
          x1="156"
          y1="14"
          x2="156"
          y2="92"
          strokeWidth="1"
          className="stroke-neutral-300 dark:stroke-neutral-700"
        />
        <text
          x="156"
          y="8"
          textAnchor="middle"
          className="fill-neutral-500 dark:fill-neutral-400"
          style={{ fontSize: "9px", fontWeight: 600 }}
        >
          now
        </text>
        {/* forecast */}
        <polyline
          points="156,46 192,39 228,21 264,32 308,66"
          fill="none"
          strokeWidth="2"
          strokeDasharray="5 4"
          strokeLinecap="round"
          className="stroke-[#C8102E] dark:stroke-[#ff4f68]"
        />
        <text
          x="12"
          y="102"
          className="fill-neutral-400 dark:fill-neutral-500"
          style={{ fontSize: "9px" }}
        >
          6 AM
        </text>
        <text
          x="308"
          y="102"
          textAnchor="end"
          className="fill-neutral-400 dark:fill-neutral-500"
          style={{ fontSize: "9px" }}
        >
          11 PM
        </text>
      </svg>
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-[#C8102E] dark:bg-[#ff4f68]" />
          Today so far
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="w-4 border-t-2 border-dashed border-[#C8102E] dark:border-[#ff4f68]"
          />
          Forecast
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="w-4 border-t-2 border-dotted border-neutral-400 dark:border-neutral-500"
          />
          Typical for this weekday
        </span>
      </figcaption>
    </figure>
  );
}

export function HowItWorksDialog() {
  // "closing" keeps the dialog mounted while the exit animation plays.
  const [state, setState] = useState<"closed" | "open" | "closing">("closed");
  const titleId = useId();
  const isClosing = state === "closing";

  const close = useCallback(() => {
    setState((s) => (s === "open" ? "closing" : s));
  }, []);

  useEffect(() => {
    if (state !== "open") return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [state, close]);

  useEffect(() => {
    if (state !== "closing") return;
    // Slightly longer than the 160ms exit animation; also the unmount path
    // when reduced motion disables the animation entirely.
    const timer = setTimeout(() => setState("closed"), 180);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <>
      <button type="button" onClick={() => setState("open")} className={pillLinkClass}>
        <CircleHelp className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
        How does this work?
      </button>

      {state !== "closed" ? (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm ${
            isClosing ? "motion-safe:animate-overlay-out" : "motion-safe:animate-overlay-in"
          }`}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={`max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950 ${
              isClosing ? "motion-safe:animate-dialog-out" : "motion-safe:animate-dialog-in"
            }`}
          >
            <div className="flex items-start justify-between gap-3 px-6 pt-6">
              <div>
                <h2
                  id={titleId}
                  className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50"
                >
                  How this works
                </h2>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  From a headcount at the gym to the dashed forecast line.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="-mr-2 -mt-2 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
              <section className="px-6 py-5">
                <SectionLabel>The data</SectionLabel>
                <ol className="mt-3">
                  <PipelineStep title="Counted at the gym">
                    Northeastern Rec posts a live headcount for every zone on its{" "}
                    <a
                      href="https://recreation.northeastern.edu/live-facility-counts/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#C8102E] hover:underline dark:text-[#ff8fa0]"
                    >
                      Live Facility Counts
                    </a>{" "}
                    page.
                  </PipelineStep>
                  <PipelineStep title="Saved when it changes">
                    A collector checks that page around the clock and stores a reading whenever a
                    zone&apos;s number changes. The source refreshes each zone about every half
                    hour, so gaps between points are normal.
                  </PipelineStep>
                  <PipelineStep title="Charted here" last>
                    Every chart, heatmap cell, and average on this page is built from those
                    readings. The only estimate is the forecast, explained below.
                  </PipelineStep>
                </ol>
              </section>

              <section className="px-6 py-5">
                <SectionLabel>The percentages</SectionLabel>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  Occupancy is the latest count divided by the zone&apos;s posted capacity: 67
                  people in a zone built for 90 is{" "}
                  <span className="font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                    74%
                  </span>
                  . Counts can go past 100% at peak times, and the dashboard shows the real number
                  instead of capping it.
                </p>
                <div className="mt-4">
                  <div className="flex h-2 w-full overflow-hidden rounded-full">
                    {SCALE.map((s) => (
                      <div key={s.label} style={{ width: s.width, backgroundColor: s.color }} />
                    ))}
                  </div>
                  <div className="mt-2 flex text-xs text-neutral-500 dark:text-neutral-400">
                    {SCALE.map((s) => (
                      <div key={s.label} style={{ width: s.width }}>
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">
                          {s.label}
                        </span>{" "}
                        <span className="tabular-nums">{s.range}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="px-6 py-5 pb-6">
                <SectionLabel>The forecast</SectionLabel>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  Today&apos;s charts end in a dashed line showing how the rest of the day is
                  likely to go. It is built in three steps:
                </p>
                <ol className="mt-3 space-y-2.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {[
                    <>
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        Start from the usual.
                      </span>{" "}
                      Take this weekday&apos;s average count for each hour, across the current
                      semester.
                    </>,
                    <>
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        Check today&apos;s pace.
                      </span>{" "}
                      Compare today so far against those averages. If the morning ran 20% busier
                      than usual, the factor is 1.2. It always stays between 0.5 and 1.5 so one
                      odd hour can&apos;t skew it.
                    </>,
                    <>
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        Scale the rest of the day.
                      </span>{" "}
                      Each remaining hour&apos;s average is multiplied by that factor and drawn as
                      the dashed line.
                    </>,
                  ].map((content, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-semibold tabular-nums text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                        {i + 1}
                      </span>
                      <span>{content}</span>
                    </li>
                  ))}
                </ol>
                <ForecastFigure />
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
