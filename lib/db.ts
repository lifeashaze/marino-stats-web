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
