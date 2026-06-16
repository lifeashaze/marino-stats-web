# Marino Stats Overhaul — Implementation Plan

## Context

The app is a gym-occupancy dashboard for Northeastern (Turso DB, scraped every ~10 min by an external repo). Today `app/page.tsx` is `force-dynamic` and ships **all ~25k raw rows (~3 MB) on every request** to a 687-line client `dashboard.tsx` that computes everything in the browser — with baselines that wrongly mix busy Spring data into quiet Summer averages (confirmed ~35% semester gap), and date math that's only correct for viewers in Eastern Time.

Goal (agreed with user, ship before Fall 2026): turn the app from "data display" into "should I go now?" — SQL-side aggregation + ISR caching, an academic-calendar config, semester-scoped baselines, a "Right now" hero with busier/quieter verdicts, a rest-of-today forecast, and a semester-comparison view. Visual language (amber/neutral, chip radio groups) stays.

**Verified DB facts that shape everything:**
- `last_updated_at` is a **naive ET string** (no Z); `fetched_at` is UTC. Cardinal rule: **never `new Date(naiveString)`** — bucket via SQLite `strftime`/`date()` on the literal string (yields correct ET values), and get "now"/"today" from a new `lib/time.ts` pinned to America/New_York (server runs UTC; evenings 8 PM–midnight ET would otherwise be "tomorrow").
- SQLite `strftime('%w')`: **0=Sun…6=Sat** — the canonical day-of-week convention app-wide.
- Closures are real closures, not bugs: 2026-02-23 snowstorm (all), Memorial Day 5/25, SquashBusters closed weekends during breaks/summer (all Sat+Sun since Apr 25; Feb 28–Mar 1, Mar 7–8). Closed days have zero rows.
- Counts legitimately exceed capacity (115 vs cap 105): show true % (>100% ok); only color scales/gauge saturate at 100%. Never clamp numbers.
- One duplicate `(location_id, last_updated_at)` pair exists (PK is `(location_id, fetched_at)`) — readings query must dedupe.
- Studios A/B = `location_id` 9531/9532, class-driven → no busy/quiet verdicts.
- Worst aggregation query: 888 rows / ~360 ms — fine behind 5-min ISR.

## File inventory

**New:** `lib/time.ts`, `lib/academic-calendar.ts`, `lib/queries.ts`, `lib/forecast.ts`, and `components/dashboard/`: `zone-utils.ts`, `zone-chip-group.tsx`, `header.tsx`, `go-now-section.tsx`, `go-now-card.tsx`, `date-selector.tsx`, `zone-charts-section.tsx`, `zone-area-chart.tsx`, `heatmap-section.tsx`, `semester-comparison-section.tsx`.

**Rewritten:** `app/page.tsx` (ISR + single data call + `SetupNotice` when db null), `components/dashboard.tsx` (→ ~120-line client orchestrator).

**Deleted:** `components/example.tsx`, `components/component-example.tsx`, `components/ui/chart.tsx` (all verified unreferenced), `app/api/facilities/route.ts`, `app/api/locations/route.ts` (unused by UI; decision: delete — trivially restorable, or a thin `app/api/dashboard/route.ts` over `getDashboardData()` later if ever wanted).

**Touched:** `lib/db.ts` (drop now-unused `LocationCount`/`LocationWithCounts` types), `CLAUDE.md` (final docs pass).

## 1. `lib/time.ts` — ET helpers (no date libs)

```ts
export type ETParts = { dateStr: string; year/month/day/hour/minute: number; dayOfWeek: number /* 0=Sun…6=Sat */ };
nowET(): ETParts                  // Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",hourCycle:"h23",...}).formatToParts
todayET(): string                 // 'YYYY-MM-DD'
addDaysET(d, n) / daysBetween(a,b) / dayOfWeekOf(d)   // noon-UTC arithmetic on 'YYYY-MM-DD' — DST-immune
etToComparableMs(naive)           // Date.parse(naive+"Z") — pseudo-UTC trick for deltas
nowComparableMs(); minutesAgoET(naive)
etHourFraction(naive)             // +s.slice(11,13) + +s.slice(14,16)/60
formatTimeLabel(naive) / formatHourLabel(h) / formatDateLabel(dateStr)   // string slicing / Intl with timeZone:"UTC" on noon-UTC dates
```
File-top comment: the never-`new Date(naive)` rule + the one DST soft spot (`minutesAgoET` off by 1 h during the Nov transition hour, gym closed then — accepted).

## 2. `lib/academic-calendar.ts` — editable config + helpers

```ts
SEMESTERS: Semester[] = [
  { id:"spring2026", label:"Spring 2026", start:"2026-01-05", end:"2026-05-03", isRegular:true },
  { id:"summer2026", label:"Summer 2026", start:"2026-05-04", end:"2026-08-23", isRegular:false,
    subSessions:[{Summer 1: 05-04→06-24},{Summer 2: 06-29→08-19}] },
  { id:"fall2026", label:"Fall 2026", start:"2026-09-08", end:"2026-12-19", isRegular:true },
]  // "EDIT HERE when NEU publishes official dates" comment
CLOSURES: [{date:"2026-02-23",reason:"Snowstorm"},{date:"2026-05-25",reason:"Memorial Day"},
  ...4 facility-scoped SquashBusters spring-break weekend dates (Feb 28, Mar 1, Mar 7, Mar 8)]
WEEKEND_CLOSURES: [{facilityName:"SquashBusters Center", start:"2026-04-25", end:"2026-09-07", reason:"Closed weekends (summer hours)"}]

semesterFor(dateStr); currentSemester()  // falls back to most-recent started semester in gaps
weekOfSemester(dateStr, semester?)       // floor(daysBetween(start,d)/7)+1, min 1
isClosed(facilityName, dateStr): string|null            // CLOSURES then weekend rules (Sat/Sun in range)
isClosedOnDayOfWeek(facilityName, semester, dow): bool  // drives heatmap "Closed" weekend cells
globalClosureDates(): string[]           // un-scoped CLOSURES → SQL exclusion
```

## 3. `lib/queries.ts` — payload contract + exact SQL (all verified on prod)

Types: `Zone`, `Reading {locationId,count,recordedAt}`, `HourlyBaseline {locationId,dayOfWeek,hour,avgCount,samples}`, `SemesterHourlyAvg {semesterId,locationId,hour,avgCount,samples}`, `LatestReading {locationId,count,recordedAt,fetchedAt}`, and:

```ts
type DashboardData = { todayET; serverNow: ETParts; currentSemesterId; zones: Zone[];
  recentDates: string[]; recentReadings: Reading[]; baselines: HourlyBaseline[];
  semesterHourly: SemesterHourlyAvg[]; latest: LatestReading[] };
getDashboardData(): Promise<DashboardData|null>   // null ⇔ db null; no try/catch — let errors propagate
```

Single roundtrip: `db.batch([Q1,Q2,Q3,(Q4 per semester),Q5], "read")`.

- **Q1 zones:** `SELECT location_id, location_name, facility_name, total_capacity FROM locations ORDER BY facility_name, location_name`
- **Q2 readings, 8 most recent ET dates, deduped:**
```sql
WITH recent_dates AS (SELECT DISTINCT date(last_updated_at) AS d FROM location_counts ORDER BY d DESC LIMIT 8)
SELECT location_id, last_updated_at, MAX(last_count) AS last_count
FROM location_counts WHERE date(last_updated_at) IN (SELECT d FROM recent_dates)
GROUP BY location_id, last_updated_at ORDER BY location_id, last_updated_at
```
  `recentDates` derived in TS from results (no extra query).
- **Q3 current-semester baselines** (args `[start, end, todayET(), ...globalClosureDates()]`, dynamic `?` list):
```sql
SELECT location_id, CAST(strftime('%w', last_updated_at) AS INTEGER) AS day_of_week,
       CAST(strftime('%H', last_updated_at) AS INTEGER) AS hour,
       ROUND(AVG(last_count), 1) AS avg_count, COUNT(*) AS samples
FROM location_counts
WHERE date(last_updated_at) >= ? AND date(last_updated_at) <= ?
  AND date(last_updated_at) < ?          -- exclude today
  AND date(last_updated_at) NOT IN (...) -- closures (defensive)
GROUP BY location_id, day_of_week, hour
```
  (`ROUND(,1)` also trims ~14 KB of float noise from JSON.)
- **Q4 per-semester hour-of-day avgs:** same WHERE shape, `GROUP BY location_id, hour`; run per configured semester; drop empty results (fall2026 now).
- **Q5 latest per zone:** self-join on `MAX(fetched_at)` per location.

## 4. `app/page.tsx`

```ts
export const revalidate = 300;   // replaces force-dynamic
const data = await getDashboardData();
if (!data) return <SetupNotice />;   // inline; build never throws without env
return <Dashboard data={data} />;
```
**Decision: ISR over Cache Components** — single route, one shared non-personalized dataset = classic ISR; `cacheComponents:true` would change app-wide dynamic semantics for no benefit here.

## 5. `lib/forecast.ts` (pure, client-consumed)

`buildForecast({todayPoints, baselineByHour, nowHourFraction})` →
1. bucket today's actuals by hour → `actualAvg[h]` for elapsed hours;
2. ratios over hours with `baseline ≥ 2` (`MIN_BASELINE_FOR_TREND`);
3. `trendFactor = clamp(mean(ratios), 0.5, 1.5)` (1 if none);
4. points: future baseline hours × trendFactor (baseline hour coverage = de-facto open hours);
5. null when no future hours / empty baseline.

## 6. Components & data flow

**`dashboard.tsx` orchestrator** (`"use client"`, props `{data: DashboardData}`):
- State: `selectedDate` (init `recentDates[0] ?? todayET`), `heatmapZoneId`, `comparisonZoneId`, `now: ETParts` — **init `data.serverNow`** (hydration-safe), then `useEffect` → `nowET()` on mount + 60 s interval.
- `useMemo` lookups shared down: `zoneGroups` (3rd-floor-first sort preserved from old `compareLocationsForDisplay`), `baselineLookup` (zone→dow→hour→{avg,samples}), `latestByZone`, `readingsForDate` (filter by `recordedAt.startsWith(selectedDate)`), `semesterHourlyByZone`.
- Render: `Header` → `GoNowSection` → `DateSelector`+`ZoneChartsSection` → `HeatmapSection` → `SemesterComparisonSection`.

**`zone-utils.ts`**: move `getCompactLocationName`/floor-rank/grouping verbatim from old dashboard; add `buildBaselineLookup`, `getUtilizationColor` (existing green<40/yellow<70/red thresholds), `CLASS_DRIVEN_LOCATION_IDS = new Set([9531, 9532])`.

**`header.tsx`**: existing title/link/ThemeToggle + amber badge `“Summer 2026 · Week N”` (`weekOfSemester(todayET)`).

**`go-now-section/card`**: pure `getZoneStatus()` ladder — `closed` (via `isClosed`) → `no-data` → `stale` (>45 min: muted count, "as of 3:10 PM", no verdict) → `class-driven` (count only) → `live` with verdict: ratio to `baseline[zone][now.dayOfWeek][now.hour]`; quieter <0.75, busier >1.25, null if baseline missing or avg<2. Card: big count + `CircularProgress` (existing component) + true un-clamped % + verdict pill + freshness. Grid 2-col mobile → 4-col desktop.

**`date-selector.tsx`**: same chips; plain `'YYYY-MM-DD'` state; `todayET` chip renders "Today"; labels via `formatDateLabel`.

**`zone-charts-section/zone-area-chart`**: switch X to **numeric `hourFraction`** (`type="number"`, ticks every 3 h) — fixes uneven-cadence spacing and enables the forecast overlay. Keep amber gradient, Y-tick generator, capacity-aware domain (include forecast values), "Last Count" corner block (from `latestByZone`, shown when `selectedDate===todayET`). Forecast: bridge point at last actual + second dashed `<Area dataKey="forecast">` with lighter fill; tooltip "Actual"/"Forecast". Empty state: `isClosed(facility, selectedDate)` → "Closed — {reason}", else "No data available".

**`heatmap-section.tsx`**: keep grid markup (cols hours 5–23 then 0; rows Mon–Sun; row dow = `(rowIdx+1)%7`). Cells read `baselineLookup` — **no client recomputation**. Color/opacity use `min(util,100)`; tooltip shows true % + "{avg} avg · {samples} readings". Weekend "Closed" cells via `isClosedOnDayOfWeek` (striped, low opacity). Drop per-row MM/DD labels (rows are semester aggregates now); subtitle "Average occupancy by hour · {semester} to date · excludes today and closures." Empty-baseline state for semester day 1.

**`semester-comparison-section.tsx`**: shared `ZoneChipGroup` (extracted from heatmap chips); Recharts `LineChart`, hours 5–23, one `Line` per semester with data, `stroke="var(--chart-N)"` by configured index, legend with "(in progress)" when `end >= todayET`. Renders whatever semesters exist.

**Payload:** ~200 KB data (readings ~105–135 KB, baselines ~65 KB, rest small) → ~250 KB page raw, ~35–50 KB gzipped, vs ~3 MB today.

## Commit order (each commit builds + runs)

1. `chore: remove dead components` — example.tsx, component-example.tsx, ui/chart.tsx.
2. `feat: ET time + academic calendar helpers` — lib/time.ts, lib/academic-calendar.ts (pure, unused).
3. `feat: aggregated data layer` — lib/queries.ts (spot-check SQL with throwaway `node -e` against prod first).
4. `feat: dashboard rewrite on aggregated data + ISR` — the cutover: page.tsx, orchestrator, zone-utils, chip-group, header, date-selector, charts (no forecast yet), heatmap. Payload already ~10× down.
5. `feat: Right now hero` — go-now section/card + `now` ticker.
6. `feat: rest-of-today forecast overlay` — lib/forecast.ts + chart wiring.
7. `feat: semester comparison` — comparison section + state.
8. `chore: delete unused API routes, prune db types, update CLAUDE.md`.

## Risks / edge cases (encode as comments where noted)

- DST: SQL bucketing DST-immune by construction; `minutesAgoET` 1 h off only inside the Nov transition hour (gym closed) — comment in time.ts.
- ET midnight + ISR: page may carry yesterday's `todayET` ≤5 min past midnight — accepted.
- Hour-0 readings belong to the *next* day's date/dow (midnight column = prior evening's close-out) — same as current behavior; comment in heatmap.
- Scraper outage: heroes flip to `stale`; `selectedDate` falls back to newest date with data; forecast self-suppresses.
- Sparse history/semester day 1: empty heatmap state, null verdicts, null forecast; comparison renders past semesters.
- Future index (only if table grows ~10×): `CREATE INDEX ... ON location_counts(last_updated_at)` from the scraper repo — note only.

## Verification

Per commit: `npm run lint && npm run build`.

End-to-end (after commit 4, re-run at end):
1. **Null-db build:** `TURSO_DB_URL=your_turso_db_url_here npm run build` (sentinel string makes db null) → succeeds, prerenders SetupNotice.
2. **Payload:** measure `main` first, then branch: `npm run build && npm run start` + `curl -s localhost:3000 | wc -c` (and `| gzip -c | wc -c`) → expect ~3 MB → ~250 KB / ~40 KB gz.
3. **ISR headers:** `curl -sI localhost:3000 | grep -i cache` → `s-maxage=300, stale-while-revalidate`.
4. **ET-under-UTC:** `TZ=UTC npm run dev` (mirrors Vercel) → week badge, "Today" chip, heatmap alignment, "as of" times all match ET wall clock.
5. **Data sanity:** hero counts ≈ recreation.northeastern.edu live page; one heatmap cell hand-checked against Q3 via `node -e`; comparison shows Spring above Summer (~35%); Sun 2026-06-07 → SquashBusters "Closed — weekends (summer hours)".
6. **Forecast eyeball:** dashed continuation from last reading to typical close, sensible scale; absent on past dates/after close.
