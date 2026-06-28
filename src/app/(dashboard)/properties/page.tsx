import { getProperties } from "@/lib/data";
import { PropertiesClient } from "./properties-client";

// Re-aggregate from the source portals every 10 minutes.
export const revalidate = 600;

export default async function PropertiesPage() {
  const properties = await getProperties();
  return <PropertiesClient properties={properties} />;
}
