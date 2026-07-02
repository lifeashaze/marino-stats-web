import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { pillLinkClass } from "@/components/dashboard/pill-link";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Changelog | NEU Rec Analytics",
  description: "Everything that has changed on the dashboard, newest first.",
};

type Tag = "New" | "Improved" | "Fixed" | "Removed";

type Release = {
  date: string; // YYYY-MM-DD
  title: string;
  entries: Array<{ tag: Tag; text: string }>;
};

const RELEASES: Release[] = [
  {
    date: "2026-07-02",
    title: "A proper explainer, and this page",
    entries: [
      { tag: "New", text: "This changelog, with the dashboard's full history in one place." },
      {
        tag: "Improved",
        text: "The “How does this work?” dialog now covers where the counts come from, what the percentages mean, and how the forecast is drawn, with a visual instead of a wall of text.",
      },
      { tag: "Removed", text: "The “What's new?” popup, replaced by this page." },
    ],
  },
  {
    date: "2026-07-01",
    title: "Faster dashboard",
    entries: [
      {
        tag: "Improved",
        text: "Sections only re-render when their data changes, and semesters that haven't started yet are skipped entirely.",
      },
      { tag: "Fixed", text: "A database client bug that kept the app from starting in local development." },
    ],
  },
  {
    date: "2026-06-19",
    title: "Fresher data, honest labels",
    entries: [
      {
        tag: "New",
        text: "The page keeps itself current. Data refreshes every 90 seconds while open, and immediately when you return to the tab.",
      },
      {
        tag: "Improved",
        text: "Charts now distinguish “the count hasn't changed” from “the data is stale”, and give the pipeline up to two hours of silence before flagging anything.",
      },
      {
        tag: "Improved",
        text: "Data loads are cached and retried, so one flaky connection can't take the page down.",
      },
    ],
  },
  {
    date: "2026-06-16",
    title: "Pins and Northeastern colors",
    entries: [
      {
        tag: "New",
        text: "Pin the zones you visit most to keep them in a dedicated section at the top. Pins stay in your browser.",
      },
      {
        tag: "New",
        text: "A Northeastern-inspired theme in light and dark, plus a proper favicon and footer.",
      },
    ],
  },
  {
    date: "2026-06-12",
    title: "Smarter heatmap dates",
    entries: [
      {
        tag: "Improved",
        text: "Each weekday row in the heatmap now uses its most recent completed date, so missing hours no longer quietly fall back to older weeks.",
      },
    ],
  },
  {
    date: "2026-06-10",
    title: "The big rewrite",
    entries: [
      { tag: "New", text: "“Right now” verdicts calling each zone busy or quiet at a glance." },
      { tag: "New", text: "A rest-of-day forecast drawn onto today's charts as a dashed line." },
      {
        tag: "New",
        text: "Semester comparison: average occupancy by hour, one line per semester with data.",
      },
      {
        tag: "Improved",
        text: "Rebuilt on an aggregated data layer that understands Eastern time and the academic calendar: breaks, holidays, and weekend closures.",
      },
    ],
  },
  {
    date: "2026-02-13",
    title: "Branding and analytics",
    entries: [
      { tag: "Improved", text: "Heatmap polish, an app icon, and proper social-sharing cards." },
      { tag: "New", text: "Anonymous usage analytics to learn which features get used." },
    ],
  },
  {
    date: "2026-02-11",
    title: "Heatmap tooltips",
    entries: [
      { tag: "New", text: "Hover any heatmap cell to see the exact reading behind it." },
      { tag: "Improved", text: "Times are shown in 12-hour format with AM/PM." },
    ],
  },
  {
    date: "2026-02-08",
    title: "Capacity on the page",
    entries: [
      { tag: "New", text: "Each zone shows its posted capacity next to the live count." },
      { tag: "Improved", text: "Cleaner Y-axis ticks on the facility charts." },
    ],
  },
  {
    date: "2026-02-06",
    title: "First release",
    entries: [
      {
        tag: "New",
        text: "Live occupancy for Marino and SquashBusters: interactive charts, a day-by-hour heatmap, and dark mode.",
      },
    ],
  },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2026-07-02" → "July 2, 2026" without ever constructing a Date. */
function formatDate(date: string): string {
  const [y, m, d] = date.split("-");
  return `${MONTHS[Number(m) - 1]} ${Number(d)}, ${y}`;
}

const TAG_STYLES: Record<Tag, string> = {
  New: "bg-[#fde8ed] text-[#8f0b22] dark:bg-[#330711] dark:text-[#ffb3bf]",
  Improved: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800/80 dark:text-neutral-300",
  Fixed: "bg-[#a4804a]/15 text-[#7a5f35] dark:bg-[#c8a978]/15 dark:text-[#c8a978]",
  Removed:
    "border border-neutral-200 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400",
};

function ReleaseDate({ release, latest }: { release: Release; latest: boolean }) {
  return (
    <>
      <time
        dateTime={release.date}
        className="text-xs font-medium uppercase tracking-wide text-neutral-400 tabular-nums dark:text-neutral-500"
      >
        {formatDate(release.date)}
      </time>
      {latest ? (
        <span className="inline-flex items-center rounded-full bg-[#fde8ed] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8f0b22] dark:bg-[#330711] dark:text-[#ffb3bf]">
          Latest
        </span>
      ) : null}
    </>
  );
}

export default function ChangelogPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className={pillLinkClass}>
          <ArrowLeft className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
          Dashboard
        </Link>
        <ThemeToggle />
      </div>

      <header className="mt-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a4804a] dark:text-[#c8a978]">
          NEU Rec Analytics
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-100">
          Changelog
        </h1>
        <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
          Everything that has changed on the dashboard, newest first.
        </p>
      </header>

      <div className="mt-12">
        {RELEASES.map((release, i) => (
          <section
            key={release.date}
            className="group relative grid motion-safe:animate-rise sm:grid-cols-[8.5rem_1fr] sm:gap-x-8"
            style={{ animationDelay: `${Math.min(i * 70, 420)}ms` }}
          >
            {/* Desktop: date in the left gutter, right-aligned against the rail. */}
            <div className="hidden sm:flex sm:flex-col sm:items-end sm:gap-1.5 sm:pt-1">
              <ReleaseDate release={release} latest={i === 0} />
            </div>

            <div className="relative border-l border-neutral-200 pb-12 pl-6 group-last:pb-2 sm:pl-8 dark:border-neutral-800">
              <span
                aria-hidden
                className="absolute -left-[4.5px] top-2 h-2 w-2 rounded-full bg-[#C8102E] ring-4 ring-white dark:bg-[#ff4f68] dark:ring-neutral-950"
              />
              <div className="flex items-center gap-2 sm:hidden">
                <ReleaseDate release={release} latest={i === 0} />
              </div>
              <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-neutral-900 sm:mt-0 dark:text-neutral-100">
                {release.title}
              </h2>
              <ul className="mt-3 space-y-2.5">
                {release.entries.map((entry) => (
                  <li key={entry.text} className="flex items-start gap-2.5">
                    <span
                      className={`mt-0.5 inline-flex w-[4.5rem] shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${TAG_STYLES[entry.tag]}`}
                    >
                      {entry.tag}
                    </span>
                    <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                      {entry.text}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
