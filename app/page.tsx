import { getDashboardData } from "@/lib/queries";
import { Dashboard } from "@/components/dashboard";
import { DeferredDashboard } from "@/components/deferred-dashboard";

// ISR: scraper writes every ~10 min; 60s cache keeps normal refreshes and
// router.refresh() near-live without hammering Turso on every request.
export const revalidate = 60;

const BUILD_PHASE = "phase-production-build";

function SetupNotice() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a] p-4">
      <div className="bg-white dark:bg-neutral-900 border border-[#C8102E]/20 dark:border-[#660817] rounded-xl p-8 max-w-md">
        <h2 className="text-lg font-semibold text-[#C8102E] dark:text-[#ff8fa0] mb-2">
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
  let data: Awaited<ReturnType<typeof getDashboardData>>;
  let buildDeferred = false;

  try {
    data = await getDashboardData();
  } catch {
    if (process.env.NEXT_PHASE === BUILD_PHASE) {
      buildDeferred = true;
      data = null;
    } else {
      throw new Error("Failed to load dashboard data");
    }
  }

  if (buildDeferred) return <DeferredDashboard />;
  if (!data) return <SetupNotice />;
  return <Dashboard data={data} />;
}
