# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js 16 dashboard answering "should I go to the gym now?" for Northeastern University recreation facilities (data scraped from recreation.northeastern.edu by a separate external process — this repo only reads). Built with React 19, TypeScript, Tailwind CSS 4, Recharts, and Turso (libSQL).

## Development Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

There is no test suite. Spot-check data-layer changes with throwaway scripts: `npx -y tsx --env-file=.env.local <script>.mts` (read-only SELECTs only).

## Critical invariants

- **`last_updated_at` is a naive Eastern-time string** (`2026-06-10T16:13:35.627`, no Z); `fetched_at` is UTC. **Never call `new Date()` on a naive string** — bucket via SQLite `date()`/`strftime()` on the literal string (yields correct ET values) and get "now"/"today" from `lib/time.ts` (pinned to America/New_York; the server runs UTC).
- Day-of-week convention everywhere: **0=Sun … 6=Sat** (matches SQLite `strftime('%w')`).
- Counts can legitimately exceed `total_capacity` — display true utilization (>100% allowed); only color scales/gauges saturate at 100%. Never clamp the numbers.
- Zero-data days are usually real closures, not scraper bugs (snowstorms, holidays, SquashBusters weekend closures during breaks/summer) — they're modeled in `lib/academic-calendar.ts`, which needs a yearly edit when NEU publishes dates.
- Studios A/B (location_ids 9531/9532) are class-driven; busy/quiet verdicts are suppressed for them (`CLASS_DRIVEN_LOCATION_IDS` in `components/dashboard/zone-utils.ts`).

## Architecture

### Data flow

1. `app/page.tsx` is a server component with **ISR (`revalidate = 300`)** — the scraper writes every ~10 min, so 5-min cached HTML is always fresh enough. It calls `getDashboardData()` and renders a `SetupNotice` if the db env is missing (`db` from `lib/db.ts` is **null** when `TURSO_DB_URL`/`TURSO_AUTH_TOKEN` are unset, so builds succeed without credentials).
2. `lib/queries.ts` builds the whole payload in **one `db.batch(..., "read")` roundtrip**: zones, last-8-days readings (deduped), current-semester hourly baselines (per zone × day-of-week × hour, excluding today and closures), per-semester hour-of-day averages, and latest reading per zone. ~200 KB JSON; the `DashboardData` type is the page's data contract.
3. `components/dashboard.tsx` (`"use client"`) is a thin orchestrator: state (`selectedDate`, heatmap/comparison zone ids, a 60-second `now` ticker seeded from `data.serverNow` for hydration safety) plus `useMemo` lookups, feeding the section components in `components/dashboard/`.

### Page sections (top to bottom)

- `header.tsx` — title + semester badge ("Summer 2026 · Week 6").
- `go-now-section.tsx`/`go-now-card.tsx` — live per-zone status: count, gauge, verdict vs the semester baseline for the current day-of-week+hour (quieter <75%, busier >125%, suppressed when baseline avg < 2 or reading >45 min stale; closed via calendar).
- `date-selector.tsx` + `zone-charts-section.tsx`/`zone-area-chart.tsx` — per-zone area charts on a numeric ET-hour X axis; today's chart appends a dashed rest-of-day forecast (`lib/forecast.ts`: day-of-week baseline × clamped today-so-far trend factor).
- `heatmap-section.tsx` — day×hour grid from the server-computed baselines (no client recomputation); weekend closures render striped "Closed" cells.
- `semester-comparison-section.tsx` — avg occupancy by hour, one line per semester with data; future semesters appear automatically.

### Domain libs

- `lib/time.ts` — all ET time logic; read its header comment before touching dates.
- `lib/academic-calendar.ts` — semester boundaries, closures, weekend-closure rules; helpers `currentSemester()`, `weekOfSemester()`, `isClosed()`, `isClosedOnDayOfWeek()`.
- Semester-aware features must **degrade gracefully**: render whatever history exists (first January data arrives 2027; Fall 2026 starts Sept).

### Database (Turso / libSQL)

```sql
locations (location_id PK, location_name, facility_name, total_capacity)
location_counts (location_id, last_count, last_updated_at, fetched_at, PK(location_id, fetched_at))
```
The PK allows duplicate `(location_id, last_updated_at)` pairs from re-fetches — aggregation queries dedupe with `GROUP BY ... MAX(last_count)`. No API routes exist; the page is the only consumer.

### Environment

`.env.local` (see `.env.example`): `TURSO_DB_URL`, `TURSO_AUTH_TOKEN`. Pull from Vercel with `vercel env pull .env.local`.

### UI & Styling

- shadcn/ui components in `components/ui/` on Base UI primitives ("base-nova" style); variants via CVA; merge classes with `cn()` from `lib/utils.ts`.
- Tailwind CSS 4, OKLCH variables in `app/globals.css` (incl. `--chart-1..5`), dark mode via `.dark` class toggled by `components/theme-toggle.tsx`.
- Visual language: amber accent (`rgb(217, 119, 6)`), neutral cards, chip-style radio groups (`zone-chip-group.tsx`); heatmap colors green <40% / yellow <70% / red ≥70%.
- Path alias `@/*` maps to the repo root.
