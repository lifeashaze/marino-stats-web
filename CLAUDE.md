# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js 16 dashboard visualizing Northeastern University recreation facility occupancy over time (data scraped from recreation.northeastern.edu). Built with React 19, TypeScript, Tailwind CSS 4, Recharts, and Turso (libSQL).

**This repo is visualization-only.** A separate, external process scrapes facility counts and writes them to the Turso database; this app only reads.

## Development Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

There is no test suite.

## Architecture

### Data Flow (the big picture)

1. `app/page.tsx` is an **async server component** with `export const dynamic = 'force-dynamic'`. On every request it queries Turso directly (all locations + full count history per location) and passes the result as `initialData` to the client `Dashboard` component.
2. `components/dashboard.tsx` (`"use client"`) does **all filtering client-side** with `useMemo` — no refetching when the user changes filters. It renders:
   - A traffic heatmap (day-of-week × hour grid, 5 AM–midnight) of average utilization for a selected location. **Only completed days** are included; today's readings are intentionally excluded.
   - A date selector covering the 8 most recent dates present in the data.
   - Area charts (Recharts) per location, grouped by `facility_name`, with a "Last Count" + circular capacity gauge shown only when the latest reading is from today.
3. The API routes under `app/api/` (`/api/facilities?date={iso|all}`, `/api/locations`) expose the same data over HTTP but are **not used by the dashboard** — it gets data via the server component.

### Database (Turso / libSQL)

- Client in `lib/db.ts`, exported as `db` — **it is `null` when `TURSO_DB_URL`/`TURSO_AUTH_TOKEN` are unset** (so builds succeed without credentials). Always null-check `db` before use; API routes return 503 when it's null.
- Shared row types (`Location`, `LocationCount`, `LocationWithCounts`) also live in `lib/db.ts`, though `page.tsx` and `dashboard.tsx` currently re-declare their own copies.

Schema:

```sql
locations (
  location_id INTEGER PRIMARY KEY,
  location_name TEXT NOT NULL,   -- e.g. "Marino Center - Cardio Area"
  facility_name TEXT,            -- e.g. "Marino Center" (used for grouping)
  total_capacity INTEGER         -- nullable; drives utilization % and gauges
)

location_counts (
  location_id INTEGER NOT NULL,
  last_count INTEGER NOT NULL,   -- occupancy at this time
  last_updated_at TEXT NOT NULL, -- when the count was recorded (ISO string)
  fetched_at TEXT NOT NULL,      -- when the scraper fetched it
  PRIMARY KEY (location_id, fetched_at)
)
```

### Environment Variables

Create `.env.local` with:

```
TURSO_DB_URL=...
TURSO_AUTH_TOKEN=...
```

### UI & Styling

- **shadcn/ui** components in `components/ui/`, built on Base UI primitives (`@base-ui/react`) with the "base-nova" style (`components.json`). Variants via `class-variance-authority`; merge classes with `cn()` from `lib/utils.ts`.
- **Tailwind CSS 4** with OKLCH CSS variables in `app/globals.css`; light/dark themes via the `.dark` class on `<html>`, toggled by `components/theme-toggle.tsx` (persisted in `localStorage`, falls back to `prefers-color-scheme`).
- Font is Inter only (configured in `app/layout.tsx`, which also mounts Vercel Analytics).
- Accent color is amber (`rgb(217, 119, 6)` for charts); heatmap utilization colors are green (<40%), yellow (<70%), red (≥70%).
- Path alias `@/*` maps to the repo root (`@/components`, `@/lib/db`, etc.).

## Adding New UI Components

Place shadcn/ui components in `components/ui/` following the existing patterns: Base UI primitives as the foundation, CVA for variants, `className` overrides merged with `cn()`.
