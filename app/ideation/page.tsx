"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, Check, Pin, Star } from "lucide-react";

type ZoneMock = {
  id: number;
  name: string;
  capacity: number;
  count: number;
  facility: string;
};

type VariantProps = {
  zones: ZoneMock[];
  favoriteIds: Set<number>;
  onToggleFavorite: (id: number) => void;
};

const zones: ZoneMock[] = [
  {
    id: 1,
    name: "Marino Center - 3rd Floor Select & Cardio",
    capacity: 90,
    count: 84,
    facility: "Marino Recreation Center",
  },
  {
    id: 2,
    name: "Marino Center - 3rd Floor Weight Room",
    capacity: 65,
    count: 62,
    facility: "Marino Recreation Center",
  },
  {
    id: 3,
    name: "Marino Center- 2nd Floor",
    capacity: 105,
    count: 40,
    facility: "Marino Recreation Center",
  },
  {
    id: 4,
    name: "SquashBusters - 4th Floor",
    capacity: 60,
    count: 20,
    facility: "SquashBusters Center",
  },
];

function MiniChart() {
  return (
    <svg viewBox="0 0 280 90" className="h-24 w-full text-amber-600 dark:text-amber-500">
      <path
        d="M8 70 C 36 42, 56 76, 82 52 S 126 36, 154 48 S 196 18, 226 38 S 252 58, 272 34"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M8 70 C 36 42, 56 76, 82 52 S 126 36, 154 48 S 196 18, 226 38 S 252 58, 272 34 L272 88 L8 88 Z"
        fill="currentColor"
        opacity="0.11"
      />
    </svg>
  );
}

function FavoriteBadge({ isFavorite }: { isFavorite: boolean }) {
  if (!isFavorite) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
      <Star className="h-3 w-3" fill="currentColor" />
      Favorite
    </span>
  );
}

function ZoneCardShell({
  zone,
  isFavorite,
  children,
}: {
  zone: ZoneMock;
  isFavorite: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">
              {zone.name}
            </h3>
            <FavoriteBadge isFavorite={isFavorite} />
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Capacity {zone.capacity} · {zone.facility}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-500">
            Now
          </p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-500">{zone.count}</p>
        </div>
      </div>
      <MiniChart />
      {children}
    </div>
  );
}

function VariantPanel({
  title,
  thesis,
  children,
}: {
  title: string;
  thesis: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">{title}</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{thesis}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{children}</div>
    </section>
  );
}

function CornerActionVariant({ zones, favoriteIds, onToggleFavorite }: VariantProps) {
  return (
    <VariantPanel
      title="Option A: quiet corner action"
      thesis="Keep favorites as a small secondary action in the top-right corner, away from the chart title."
    >
      {zones.slice(0, 2).map((zone) => {
        const isFavorite = favoriteIds.has(zone.id);
        return (
          <div
            key={zone.id}
            className="relative rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <button
              type="button"
              onClick={() => onToggleFavorite(zone.id)}
              aria-pressed={isFavorite}
              className={`absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                isFavorite
                  ? "border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                  : "border-neutral-200 bg-white text-neutral-400 hover:text-amber-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-500 dark:hover:text-amber-300"
              }`}
            >
              <Star className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
            </button>
            <ZoneCardShell zone={zone} isFavorite={isFavorite}>
              <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                Pros: familiar, compact. Risk: can still feel like a floating icon.
              </p>
            </ZoneCardShell>
          </div>
        );
      })}
    </VariantPanel>
  );
}

function TextActionVariant({ zones, favoriteIds, onToggleFavorite }: VariantProps) {
  return (
    <VariantPanel
      title="Option B: Favourite action under metadata"
      thesis="Make the action explicit and low-pressure: users read capacity, then decide whether to save it."
    >
      {zones.slice(0, 2).map((zone) => {
        const isFavorite = favoriteIds.has(zone.id);
        return (
          <ZoneCardShell key={zone.id} zone={zone} isFavorite={isFavorite}>
            <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Keep this zone near the top.
              </p>
              <button
                type="button"
                onClick={() => onToggleFavorite(zone.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  isFavorite
                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-300"
                    : "bg-neutral-100 text-neutral-700 hover:bg-amber-100 hover:text-amber-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-amber-500/15 dark:hover:text-amber-300"
                }`}
              >
                {isFavorite ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Star className="h-3.5 w-3.5" />
                )}
                {isFavorite ? "Favourited" : "Favourite"}
              </button>
            </div>
          </ZoneCardShell>
        );
      })}
    </VariantPanel>
  );
}

function SelectionModeVariant({ zones, favoriteIds, onToggleFavorite }: VariantProps) {
  return (
    <VariantPanel
      title="Option C: manage mode"
      thesis="Separate normal chart browsing from editing favorites. This is calmer, but adds one extra step."
    >
      {zones.slice(0, 2).map((zone) => {
        const isFavorite = favoriteIds.has(zone.id);
        return (
          <button
            key={zone.id}
            type="button"
            onClick={() => onToggleFavorite(zone.id)}
            className={`rounded-lg border p-4 text-left shadow-sm transition-colors ${
              isFavorite
                ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-500/10"
                : "border-neutral-200 bg-white hover:border-amber-200 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-amber-800"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                  {zone.name}
                </h3>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Click card to toggle favorite
                </p>
              </div>
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${
                  isFavorite
                    ? "border-amber-400 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                    : "border-neutral-300 text-neutral-400 dark:border-neutral-700"
                }`}
              >
                {isFavorite ? <Check className="h-4 w-4" /> : <Pin className="h-3.5 w-3.5" />}
              </span>
            </div>
            <MiniChart />
          </button>
        );
      })}
    </VariantPanel>
  );
}

function ChipRailVariant({ zones, favoriteIds, onToggleFavorite }: VariantProps) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
            Option D: favorite rail
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Leave chart cards alone. Users manage favorites from compact zone chips above the charts.
          </p>
        </div>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {favoriteIds.size} selected
        </span>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {zones.map((zone) => {
          const isFavorite = favoriteIds.has(zone.id);
          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => onToggleFavorite(zone.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                isFavorite
                  ? "border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                  : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-amber-300 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400"
              }`}
            >
              <Bookmark className="h-3.5 w-3.5" fill={isFavorite ? "currentColor" : "none"} />
              {zone.name.replace("Marino Center - ", "").replace("Marino Center- ", "")}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {zones.slice(0, 2).map((zone) => (
          <ZoneCardShell key={zone.id} zone={zone} isFavorite={favoriteIds.has(zone.id)}>
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              Chart card stays focused on occupancy.
            </p>
          </ZoneCardShell>
        ))}
      </div>
    </section>
  );
}

export default function IdeationPage() {
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(() => new Set([2]));

  const favoriteZones = useMemo(
    () => zones.filter((zone) => favoriteIds.has(zone.id)),
    [favoriteIds]
  );

  const toggleFavorite = (id: number) => {
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-neutral-950 dark:bg-[#0a0a0a] dark:text-neutral-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-medium text-amber-700 hover:underline dark:text-amber-400"
          >
            Back to dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Favorite Zones Interaction Ideation
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
            This page is a sandbox for comparing favorite-zone UI patterns. It uses mock data and
            temporary local page state only.
          </p>
        </div>

        <section className="mb-8 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Current favorites preview
          </h2>
          {favoriteZones.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {favoriteZones.map((zone) => (
                <span
                  key={zone.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                >
                  <Star className="h-3.5 w-3.5" fill="currentColor" />
                  {zone.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              No favorites selected. This mirrors the dashboard behavior where the Favorites
              section stays hidden until something is saved.
            </p>
          )}
        </section>

        <div className="space-y-6">
          <CornerActionVariant
            zones={zones}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
          />
          <TextActionVariant
            zones={zones}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
          />
          <SelectionModeVariant
            zones={zones}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
          />
          <ChipRailVariant
            zones={zones}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
          />
        </div>
      </div>
    </main>
  );
}
