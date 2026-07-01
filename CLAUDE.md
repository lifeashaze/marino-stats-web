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
- **Rows are inserted only when a count changes upstream** (upstream updates each zone every ~35 min in summer; gaps >45 min are routine). An old `last_updated_at` means "unchanged", not "scraper down" — pipeline liveness is judged by `MAX(fetched_at)` across all zones (longest healthy open-hours silence observed: 50 min).
- Counts can legitimately exceed `total_capacity` — display true utilization (>100% allowed); only color scales/gauges saturate at 100%. Never clamp the numbers.
- Zero-data days are usually real closures, not scraper bugs (snowstorms, holidays, SquashBusters weekend closures during breaks/summer) — they're modeled in `lib/academic-calendar.ts`, which needs a yearly edit when NEU publishes dates.

## Architecture

### Data flow

1. `app/page.tsx` is a **`force-dynamic`** server component (no build-time prerender, so Turso flakes can never fail the build). Freshness/load is handled by the **60-second `unstable_cache`** around `getDashboardData()` in `lib/queries.ts` plus the client's `useAutoRefresh()` (router.refresh on focus / every 90 s while visible). It renders a `SetupNotice` if the db env is missing (`db` from `lib/db.ts` is **null** when `TURSO_DB_URL`/`TURSO_AUTH_TOKEN` are unset, so builds succeed without credentials).
2. `lib/queries.ts` builds the payload in **one `db.batch(..., "read")` roundtrip**: zones, last-8-days readings, current-semester hourly baselines for forecasts, per-semester hour-of-day averages, and latest reading per zone.
3. `components/dashboard.tsx` (`"use client"`) is a thin orchestrator: state (`selectedDate`, heatmap/comparison zone ids, a 60-second `now` ticker seeded from `data.serverNow` for hydration safety) plus `useMemo` lookups, feeding the section components in `components/dashboard/`.

### Page sections (top to bottom)

- `header.tsx` — title, data-source link, "What's new" dialog, theme toggle.
- `date-selector.tsx` + `zone-charts-section.tsx`/`zone-area-chart.tsx` — per-zone area charts on a numeric ET-hour X axis; today's chart appends a dashed rest-of-day forecast (`lib/forecast.ts`: day-of-week baseline × clamped today-so-far trend factor).
- `heatmap-section.tsx` — day×hour grid where each weekday row comes from one latest completed date, preventing missing slots from falling back to older weeks; weekend closures render striped "Closed" cells.
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

An expression index `idx_location_counts_date ON location_counts(date(last_updated_at))` exists (created 2026-07-01). SQLite only uses it when the query text matches the expression **exactly** — always filter/bucket with `date(last_updated_at)`, never a rephrasing like `substr(last_updated_at, 1, 10)`.

### Environment

`.env.local` (see `.env.example`): `TURSO_DB_URL`, `TURSO_AUTH_TOKEN`. Pull from Vercel with `vercel env pull .env.local`.

### UI & Styling

- `components/ui/` holds the one shadcn-style component in use (`circular-progress.tsx`); merge classes with `cn()` from `lib/utils.ts`. Add new shadcn components with `npx shadcn add` only when actually used.
- Tailwind CSS 4, color variables in `app/globals.css` (`--chart-1..5` must stay defined in both `:root` and `.dark` — Recharts strokes reference them directly), dark mode via `.dark` class toggled by `components/theme-toggle.tsx`.
- Visual language: amber accent (`rgb(217, 119, 6)`), neutral cards, chip-style radio groups (`zone-chip-group.tsx`); heatmap colors green <40% / yellow <70% / red ≥70%.
- Path alias `@/*` maps to the repo root.
