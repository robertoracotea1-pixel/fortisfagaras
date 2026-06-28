import { getDashboardStats, getRecentProperties } from "@/lib/data";
import { DashboardClient } from "./dashboard-client";

export const revalidate = 600;

export default async function DashboardPage() {
  const [stats, recent] = await Promise.all([
    getDashboardStats(),
    getRecentProperties(6),
  ]);
  return <DashboardClient stats={stats} recent={recent} />;
}
