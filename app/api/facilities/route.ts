import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Check if database is configured
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured. Please set TURSO_DB_URL and TURSO_AUTH_TOKEN environment variables." },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const dateFilter = searchParams.get("date");

    // Fetch all locations (db is guaranteed to be non-null here due to early return)
    const locationsResult = await db!.execute(`
      SELECT location_id, location_name, facility_name
      FROM locations
      ORDER BY facility_name, location_name
    `);

    const locations = locationsResult.rows.map((row) => ({
      location_id: row.location_id as number,
      location_name: row.location_name as string,
      facility_name: row.facility_name as string | null,
    }));

    // Fetch counts for each location
    const facilitiesData = await Promise.all(
      locations.map(async (location) => {
        let query = `
          SELECT location_id, last_count, last_updated_at, fetched_at
          FROM location_counts
          WHERE location_id = ?
          ORDER BY last_updated_at ASC
        `;

        const countsResult = await db!.execute({
          sql: query,
          args: [location.location_id],
        });

        let counts = countsResult.rows.map((row) => ({
          location_id: row.location_id as number,
          last_count: row.last_count as number,
          last_updated_at: row.last_updated_at as string,
          fetched_at: row.fetched_at as string,
        }));

        // Filter by date if specified
        if (dateFilter && dateFilter !== "all") {
          counts = counts.filter((count) => {
            const countDate = new Date(count.last_updated_at);
            const filterDate = new Date(dateFilter);
            return countDate.toDateString() === filterDate.toDateString();
          });
        }

        return {
          ...location,
          counts,
        };
      })
    );

    return NextResponse.json(facilitiesData);
  } catch (error) {
    console.error("Error fetching facilities data:", error);
    return NextResponse.json(
      { error: "Failed to fetch facilities data" },
      { status: 500 }
    );
  }
}
