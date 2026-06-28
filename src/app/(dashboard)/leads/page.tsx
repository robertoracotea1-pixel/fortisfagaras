import { getLeads } from "@/lib/data";
import { LeadsClient } from "./leads-client";

export const revalidate = 600;

export default async function LeadsPage() {
  const leads = await getLeads();
  return <LeadsClient leads={leads} />;
}
