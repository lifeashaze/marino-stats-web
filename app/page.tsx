import { db } from "@/lib/db";
import { Dashboard } from "@/components/dashboard";

// Force dynamic rendering - fetch fresh data on every request
export const dynamic = 'force-dynamic';

type LocationCount = {
  location_id: number;
  last_count: number;
  last_updated_at: string;
  fetched_at: string;
};

type FacilityData = {
  location_id: number;
  location_name: string;
  facility_name: string | null;
  total_capacity?: number;
  counts: LocationCount[];
};

async function getFacilitiesData(): Promise<FacilityData[]> {
  if (!db) {
    throw new Error("Database not configured");
  }

  // Fetch all locations
  const locationsResult = await db.execute(`
    SELECT location_id, location_name, facility_name, total_capacity
    FROM locations
    ORDER BY facility_name, location_name
  `);

  const locations = locationsResult.rows.map((row) => ({
    location_id: row.location_id as number,
    location_name: row.location_name as string,
    facility_name: row.facility_name as string | null,
    total_capacity: (row.total_capacity as number | null) ?? undefined,
  }));

  // Fetch counts for each location
  const facilitiesData = await Promise.all(
    locations.map(async (location) => {
      const countsResult = await db!.execute({
        sql: `
          SELECT location_id, last_count, last_updated_at, fetched_at
          FROM location_counts
          WHERE location_id = ?
          ORDER BY last_updated_at ASC
        `,
        args: [location.location_id],
      });

      const counts = countsResult.rows.map((row) => ({
        location_id: row.location_id as number,
        last_count: row.last_count as number,
        last_updated_at: row.last_updated_at as string,
        fetched_at: row.fetched_at as string,
      }));

      return {
        ...location,
        counts,
      };
    })
  );

  return facilitiesData;
}

export default async function Page() {
  try {
    const data = await getFacilitiesData();
    return <Dashboard initialData={data} />;
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a] p-4">
        <div className="bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-900 rounded-xl p-8 max-w-md">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Error</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {error instanceof Error ? error.message : "Failed to load data"}
          </p>
        </div>
      </div>
    );
  }
}
