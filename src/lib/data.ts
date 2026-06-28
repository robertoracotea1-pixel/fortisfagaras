import { cache } from "react";
import type { Property, Lead, DashboardStats } from "./types";
import { aggregateListings, dashboardStatsFromProperties } from "./sources/aggregate";
import { isSupabaseConfigured } from "./supabase";
import { loadPropertiesFromDb } from "./sources/db";

/**
 * Single data-access seam for the app. When Supabase is configured it reads the
 * pre-ingested catalog (instant, with price history); otherwise it falls back
 * to aggregating live from the source portals. Pages call getProperties() etc.
 * unchanged either way.
 *
 * `cache()` dedups calls within a single render; pages set `revalidate` so the
 * rendered output is cached for ~10 min between requests.
 */
const loadProperties = cache(async (): Promise<Property[]> => {
  if (isSupabaseConfigured()) {
    const fromDb = await loadPropertiesFromDb();
    // If the DB hasn't been populated yet, fall back to a live pull.
    if (fromDb.length > 0) return fromDb;
  }
  return aggregateListings();
});

export async function getProperties(): Promise<Property[]> {
  return loadProperties();
}

export async function getProperty(id: string): Promise<Property | null> {
  const props = await loadProperties();
  return props.find((p) => p.id === id) ?? null;
}

export async function getRecentProperties(limit = 6): Promise<Property[]> {
  const props = await loadProperties();
  return props.filter((p) => p.isNew).slice(0, limit);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return dashboardStatsFromProperties(await loadProperties());
}

/**
 * Leads are derived from recent private-owner (PF) listings as fresh "Nou"
 * opportunities. Status changes won't persist until Supabase is wired.
 */
export async function getLeads(): Promise<Lead[]> {
  const props = await loadProperties();
  const pf = props
    .filter((p) => p.ownerType === "PF")
    .sort((a, b) => Date.parse(b.firstSeenAt) - Date.parse(a.firstSeenAt))
    .slice(0, 40);

  return pf.map((p) => ({
    id: `lead-${p.id}`,
    property: {
      id: p.id,
      title: p.title,
      price: p.price,
      currency: p.currency,
      city: p.city,
      type: p.type,
      ownerType: p.ownerType,
    },
    owner: p.owner,
    assignedTo: "Nealocat",
    status: "Nou",
    priority: p.isNew ? "high" : "medium",
    nextFollowupAt: null,
    notes: "",
    createdAt: p.firstSeenAt,
    updatedAt: p.lastUpdatedAt,
  }));
}
