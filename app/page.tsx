import { getDashboardData } from "@/lib/queries";
import { Dashboard } from "@/components/dashboard";

// ISR: the scraper writes every ~10 min, so a 5-min page cache is always fresh
// enough; revalidation happens in the background and visitors get cached HTML.
export const revalidate = 300;

function SetupNotice() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a] p-4">
      <div className="bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-900 rounded-xl p-8 max-w-md">
        <h2 className="text-lg font-semibold text-amber-700 dark:text-amber-400 mb-2">
          Database not configured
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Set <code>TURSO_DB_URL</code> and <code>TURSO_AUTH_TOKEN</code> in{" "}
          <code>.env.local</code> (see <code>.env.example</code>), then restart the server.
        </p>
      </div>
    </div>
  );
}

export default async function Page() {
  const data = await getDashboardData();
  if (!data) return <SetupNotice />;
  return <Dashboard data={data} />;
}
