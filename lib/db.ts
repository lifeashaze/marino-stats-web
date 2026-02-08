import { createClient } from "@libsql/client";

// Create a mock client for build time when env vars aren't set
const createDbClient = () => {
  const url = process.env.TURSO_DB_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  // If environment variables aren't properly set, return a mock client
  if (!url || !authToken || url === "your_turso_db_url_here") {
    return null;
  }

  return createClient({
    url,
    authToken,
  });
};

export const db = createDbClient();

export type Location = {
  location_id: number;
  location_name: string;
  facility_name: string | null;
  total_capacity?: number; // Optional until backend is updated
};

export type LocationCount = {
  location_id: number;
  last_count: number;
  last_updated_at: string;
  fetched_at: string;
};

export type LocationWithCounts = Location & {
  counts: LocationCount[];
};
