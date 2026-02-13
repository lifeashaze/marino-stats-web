import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured. Please set TURSO_DB_URL and TURSO_AUTH_TOKEN environment variables." },
        { status: 503 }
      );
    }

    const locationsResult = await db.execute(`
      SELECT location_id, location_name, facility_name, total_capacity
      FROM locations
      ORDER BY facility_name, location_name
    `);

    const locations = locationsResult.rows.map((row) => ({
      location_id: row.location_id as number,
      location_name: row.location_name as string,
      facility_name: row.facility_name as string | null,
      total_capacity: row.total_capacity as number | null,
    }));

    return NextResponse.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
