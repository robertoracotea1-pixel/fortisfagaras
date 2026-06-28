import type { PropertyType, TransactionType, OwnerType } from "@/lib/types";

/** A single listing as scraped/fetched from one source, before dedup/merge. */
export interface RawListing {
  source: "OLX" | "Publi24" | "Storia";
  /** Stable id within the source (used for upsert + dedup). */
  externalId: string;
  url: string;
  title: string;
  description: string;
  price: number | null;
  currency: "EUR" | "RON";
  surfaceM2: number | null;
  landSurfaceM2: number | null;
  rooms: number | null;
  floor: number | null;
  city: string | null;
  propertyType: PropertyType;
  transactionType: TransactionType;
  ownerType: OwnerType | "unknown";
  ownerName: string | null;
  /** Phone is rarely available without auth; null when unknown. */
  phone: string | null;
  images: string[];
  lat: number | null;
  lon: number | null;
  /** ISO timestamp when the ad was posted/created, when known. */
  postedAt: string | null;
}

export type SourceResult = {
  source: RawListing["source"];
  listings: RawListing[];
  total: number;
  ok: boolean;
  error?: string;
};
