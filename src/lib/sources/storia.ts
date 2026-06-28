import type { PropertyType, TransactionType } from "@/lib/types";
import type { RawListing, SourceResult } from "./types";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

const ESTATE_MAP: Record<string, PropertyType> = {
  FLAT: "apartament",
  HOUSE: "casa",
  TERRAIN: "teren",
  COMMERCIAL: "spatiu_comercial",
  HALL: "spatiu_comercial",
  ROOM: "garsoniera",
  GARAGE: "spatiu_comercial",
};

const ROOM_WORDS: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
  SIX: 6,
  SEVEN: 7,
  EIGHT: 8,
  NINE: 9,
  TEN: 10,
};

// Storia URL needs an estate + transaction segment. We sweep the common ones.
const QUERIES: { estate: string; txn: TransactionType; txnSlug: string }[] = [
  { estate: "apartament", txn: "vanzare", txnSlug: "vanzare" },
  { estate: "casa", txn: "vanzare", txnSlug: "vanzare" },
  { estate: "teren", txn: "vanzare", txnSlug: "vanzare" },
  { estate: "spatiu-comercial", txn: "vanzare", txnSlug: "vanzare" },
  { estate: "apartament", txn: "inchiriere", txnSlug: "inchiriere" },
  { estate: "casa", txn: "inchiriere", txnSlug: "inchiriere" },
];

type StoriaItem = {
  id: number;
  title: string;
  estate?: string;
  transaction?: string;
  isPrivateOwner?: boolean;
  agency?: { name?: string } | null;
  advertOwner?: string | { name?: string } | null;
  totalPrice?: { value?: number; currency?: string } | null;
  rentPrice?: { value?: number; currency?: string } | null;
  areaInSquareMeters?: number | null;
  terrainAreaInSquareMeters?: number | null;
  roomsNumber?: string | number | null;
  floorNumber?: number | string | null;
  shortDescription?: string | null;
  dateCreated?: string | null;
  href?: string | null;
  location?: { address?: { city?: { name?: string } } };
  images?: { medium?: string; large?: string }[] | null;
};

function parseRooms(v: StoriaItem["roomsNumber"]): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (ROOM_WORDS[v] != null) return ROOM_WORDS[v];
  const m = String(v).match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

function parseFloor(v: StoriaItem["floorNumber"]): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (/ground|parter/i.test(String(v))) return 0;
  const m = String(v).match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

function normalizeItem(it: StoriaItem, txn: TransactionType): RawListing | null {
  if (!it?.id || !it.href) return null;
  const priceObj = it.totalPrice ?? it.rentPrice;
  const href = `https://www.storia.ro/${String(it.href).replace("[lang]", "ro")}`;
  const images = (it.images ?? [])
    .map((im) => im.large || im.medium)
    .filter((x): x is string => !!x);

  return {
    source: "Storia",
    externalId: `storia-${it.id}`,
    url: href,
    title: it.title ?? "",
    description: (it.shortDescription ?? "").replace(/<[^>]+>/g, " ").trim(),
    price: typeof priceObj?.value === "number" ? priceObj.value : null,
    currency: priceObj?.currency === "RON" ? "RON" : "EUR",
    surfaceM2: it.areaInSquareMeters ?? null,
    landSurfaceM2: it.terrainAreaInSquareMeters ?? null,
    rooms: parseRooms(it.roomsNumber),
    floor: parseFloor(it.floorNumber),
    city: it.location?.address?.city?.name ?? null,
    propertyType: (it.estate && ESTATE_MAP[it.estate]) || "apartament",
    transactionType: it.transaction === "RENT" ? "inchiriere" : txn,
    ownerType: it.isPrivateOwner ? "PF" : "AG",
    ownerName:
      it.agency?.name ||
      (typeof it.advertOwner === "string" ? it.advertOwner : it.advertOwner?.name) ||
      null,
    phone: null,
    images,
    lat: null,
    lon: null,
    postedAt: it.dateCreated ? it.dateCreated.replace(" ", "T") : null,
  };
}

function extractNextData(html: string): StoriaItem[] {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return [];
  try {
    const data = JSON.parse(m[1]);
    const items = data?.props?.pageProps?.data?.searchAds?.items;
    return Array.isArray(items) ? (items as StoriaItem[]) : [];
  } catch {
    return [];
  }
}

/** Fetch Făgăraș-area listings from Storia (parses embedded __NEXT_DATA__). */
export async function fetchStoria(): Promise<SourceResult> {
  const listings: RawListing[] = [];
  try {
    for (const { estate, txn, txnSlug } of QUERIES) {
      const url = `https://www.storia.ro/ro/rezultate/${txnSlug}/${estate}/brasov/fagaras?distanceRadius=20&limit=72`;
      const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
      if (!res.ok) continue;
      const html = await res.text();
      const items = extractNextData(html);
      for (const it of items) {
        const norm = normalizeItem(it, txn);
        if (norm) listings.push(norm);
      }
    }
    // Dedup within source (an ad can appear under multiple estate sweeps).
    const seen = new Set<string>();
    const unique = listings.filter((l) =>
      seen.has(l.externalId) ? false : (seen.add(l.externalId), true),
    );
    return { source: "Storia", listings: unique, total: unique.length, ok: true };
  } catch (e) {
    return {
      source: "Storia",
      listings,
      total: listings.length,
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
