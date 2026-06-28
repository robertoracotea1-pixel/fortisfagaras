import type { PriceHistory, Property } from "@/lib/types";
import type { RawListing } from "./types";
import { getSupabase } from "@/lib/supabase";
import { fetchAllRaw, mergeListings } from "./aggregate";

type ListingRow = {
  external_id: string;
  source: string;
  url: string;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  surface_m2: number | null;
  land_surface_m2: number | null;
  rooms: number | null;
  floor: number | null;
  city: string | null;
  property_type: string;
  transaction_type: string;
  owner_type: string;
  owner_name: string | null;
  phone: string | null;
  images: string[];
  lat: number | null;
  lon: number | null;
  posted_at: string | null;
  first_seen_at?: string;
  last_seen_at: string;
};

function toRow(l: RawListing, now: string): ListingRow {
  return {
    external_id: l.externalId,
    source: l.source,
    url: l.url,
    title: l.title,
    description: l.description,
    price: l.price,
    currency: l.currency,
    surface_m2: l.surfaceM2,
    land_surface_m2: l.landSurfaceM2,
    rooms: l.rooms,
    floor: l.floor,
    city: l.city,
    property_type: l.propertyType,
    transaction_type: l.transactionType,
    owner_type: l.ownerType,
    owner_name: l.ownerName,
    phone: l.phone,
    images: l.images,
    lat: l.lat,
    lon: l.lon,
    posted_at: l.postedAt,
    last_seen_at: now,
  };
}

function rowToRaw(r: ListingRow): RawListing {
  return {
    source: r.source as RawListing["source"],
    externalId: r.external_id,
    url: r.url,
    title: r.title,
    description: r.description,
    price: r.price,
    currency: r.currency === "RON" ? "RON" : "EUR",
    surfaceM2: r.surface_m2,
    landSurfaceM2: r.land_surface_m2,
    rooms: r.rooms,
    floor: r.floor,
    city: r.city,
    propertyType: r.property_type as RawListing["propertyType"],
    transactionType: r.transaction_type as RawListing["transactionType"],
    ownerType: r.owner_type as RawListing["ownerType"],
    ownerName: r.owner_name,
    phone: r.phone,
    images: Array.isArray(r.images) ? r.images : [],
    lat: r.lat,
    lon: r.lon,
    postedAt: r.posted_at,
  };
}

/**
 * Fetch all sources and upsert into Supabase, recording price changes.
 * Returns counts for observability.
 */
export async function ingestListings(): Promise<{
  fetched: number;
  upserted: number;
  priceChanges: number;
}> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const raw = await fetchAllRaw();
  if (raw.length === 0) return { fetched: 0, upserted: 0, priceChanges: 0 };

  const now = new Date().toISOString();
  const ids = raw.map((l) => l.externalId);

  // Existing prices, to detect changes.
  const existing = new Map<string, { price: number | null }>();
  for (let i = 0; i < ids.length; i += 500) {
    const chunk = ids.slice(i, i + 500);
    const { data } = await supabase
      .from("listings")
      .select("external_id, price")
      .in("external_id", chunk);
    for (const r of data ?? []) existing.set(r.external_id, { price: r.price });
  }

  const priceRows: { external_id: string; price: number; currency: string; observed_at: string }[] =
    [];
  for (const l of raw) {
    if (l.price == null || l.price <= 0) continue;
    const prev = existing.get(l.externalId);
    // New listing, or price changed since last seen.
    if (!prev || prev.price == null || Number(prev.price) !== l.price) {
      priceRows.push({
        external_id: l.externalId,
        price: l.price,
        currency: l.currency,
        observed_at: now,
      });
    }
  }

  // Upsert listings (omit first_seen_at so existing rows keep their original).
  const rows = raw.map((l) => toRow(l, now));
  let upserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error, count } = await supabase
      .from("listings")
      .upsert(chunk, { onConflict: "external_id", count: "exact" });
    if (error) throw new Error(`upsert listings: ${error.message}`);
    upserted += count ?? chunk.length;
  }

  // Insert price observations (after listings exist, to satisfy the FK).
  if (priceRows.length > 0) {
    for (let i = 0; i < priceRows.length; i += 500) {
      const chunk = priceRows.slice(i, i + 500);
      const { error } = await supabase.from("price_history").insert(chunk);
      if (error) throw new Error(`insert price_history: ${error.message}`);
    }
  }

  return { fetched: raw.length, upserted, priceChanges: priceRows.length };
}

/** Read listings from Supabase (seen in the last `days`) and merge to properties. */
export async function loadPropertiesFromDb(days = 30): Promise<Property[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const { data: rows, error } = await supabase
    .from("listings")
    .select("*")
    .gte("last_seen_at", since)
    .order("first_seen_at", { ascending: false });
  if (error) throw new Error(`load listings: ${error.message}`);
  if (!rows || rows.length === 0) return [];

  const raw = (rows as ListingRow[]).map(rowToRaw);

  // Pull price history for these listings.
  const ids = raw.map((l) => l.externalId);
  const phMap = new Map<string, PriceHistory[]>();
  for (let i = 0; i < ids.length; i += 500) {
    const chunk = ids.slice(i, i + 500);
    const { data: ph } = await supabase
      .from("price_history")
      .select("external_id, price, observed_at")
      .in("external_id", chunk)
      .order("observed_at", { ascending: true });
    for (const r of ph ?? []) {
      const arr = phMap.get(r.external_id) ?? [];
      arr.push({ price: Number(r.price), date: r.observed_at });
      phMap.set(r.external_id, arr);
    }
  }

  return mergeListings(raw, phMap);
}
