/**
 * Rest-of-today forecast: the semester baseline for today's day-of-week,
 * scaled by how today is actually tracking against it so far. No ML — gym
 * traffic is strongly periodic and the baseline carries most of the signal.
 */

export type ForecastPoint = { hourFraction: number; forecast: number };

export const TREND_CLAMP: readonly [number, number] = [0.5, 1.5];
/** Hours with a baseline below this are skipped when estimating the trend —
 * tiny denominators make the ratio blow up (3 people vs avg 0.5 ≠ 6× busier). */
export const MIN_BASELINE_FOR_TREND = 2;

export function buildForecast(opts: {
  /** Today's actual readings for one zone, ascending by time. */
  todayPoints: Array<{ hourFraction: number; count: number }>;
  /** hour → baseline avgCount for today's day of week, this zone. */
  baselineByHour: Map<number, number>;
  nowHourFraction: number;
}): { points: ForecastPoint[]; trendFactor: number } | null {
  const { todayPoints, baselineByHour, nowHourFraction } = opts;
  if (baselineByHour.size === 0) return null;

  const currentHour = Math.floor(nowHourFraction);

  // Average today's readings per elapsed hour.
  const actualSums = new Map<number, { sum: number; n: number }>();
  for (const p of todayPoints) {
    const h = Math.floor(p.hourFraction);
    if (h > currentHour) continue;
    const bucket = actualSums.get(h) ?? { sum: 0, n: 0 };
    bucket.sum += p.count;
    bucket.n += 1;
    actualSums.set(h, bucket);
  }

  const ratios: number[] = [];
  for (const [h, { sum, n }] of actualSums) {
    const baseline = baselineByHour.get(h);
    if (baseline === undefined || baseline < MIN_BASELINE_FOR_TREND) continue;
    ratios.push(sum / n / baseline);
  }

  const rawTrend =
    ratios.length > 0 ? ratios.reduce((a, b) => a + b, 0) / ratios.length : 1;
  const trendFactor = Math.min(TREND_CLAMP[1], Math.max(TREND_CLAMP[0], rawTrend));

  // The baseline's hour coverage is the de-facto set of open hours.
  const points: ForecastPoint[] = [...baselineByHour.entries()]
    .filter(([h]) => h > currentHour)
    .sort(([a], [b]) => a - b)
    .map(([h, avg]) => ({ hourFraction: h, forecast: Math.round(avg * trendFactor) }));

  if (points.length === 0) return null;
  return { points, trendFactor };
}
