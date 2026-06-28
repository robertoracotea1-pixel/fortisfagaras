import type { PropertyType, TransactionType } from "@/lib/types";
import type { RawListing, SourceResult } from "./types";
import { OLX } from "./geo";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

// OLX RE subcategory → (type, transaction). Verified against live offers.
const CATEGORY_MAP: Record<number, { type: PropertyType; txn: TransactionType }> = {
  709: { type: "teren", txn: "vanzare" }, // Terenuri
  710: { type: "spatiu_comercial", txn: "vanzare" }, // Spații comerciale vânzare
  911: { type: "casa", txn: "vanzare" }, // Case de vânzare
  913: { type: "casa", txn: "inchiriere" }, // Case de închiriat
  1157: { type: "apartament", txn: "inchiriere" }, // Apartamente de închiriat
  1163: { type: "garsoniera", txn: "vanzare" }, // Garsoniere de vânzare
  1165: { type: "apartament", txn: "vanzare" }, // Apartamente de vânzare
  1167: { type: "garsoniera", txn: "inchiriere" }, // Garsoniere de închiriat
  2665: { type: "spatiu_comercial", txn: "vanzare" }, // Spații industriale
};

const ROOM_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4 };

type OlxParam = {
  key: string;
  value?: { value?: number; currency?: string; key?: string; label?: string };
};

type OlxOffer = {
  id: number;
  url: string;
  title: string;
  description?: string;
  created_time?: string;
  business?: boolean;
  user?: { name?: string; company_name?: string };
  category?: { id?: number };
  location?: { city?: { name?: string } };
  map?: { lat?: number; lon?: number };
  photos?: { link?: string }[];
  params?: OlxParam[];
};

function getParam(offer: OlxOffer, key: string): OlxParam["value"] | undefined {
  return offer.params?.find((p) => p.key === key)?.value;
}

function parseFloor(raw?: string): number | null {
  if (!raw) return null;
  if (raw === "parter") return 0;
  if (raw === "demisol") return -1;
  const m = raw.match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

function parseRooms(v?: OlxParam["value"]): number | null {
  if (!v) return null;
  if (v.key && ROOM_WORDS[v.key] != null) return ROOM_WORDS[v.key];
  const m = (v.label ?? v.key ?? "").match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

function resolveTypeTxn(offer: OlxOffer): { type: PropertyType; txn: TransactionType } {
  // OLX's own taxonomy (category.id) is authoritative; keywords only fill gaps.
  const mapped = offer.category?.id ? CATEGORY_MAP[offer.category.id] : undefined;
  const t = (offer.title ?? "").toLowerCase();

  let type: PropertyType;
  if (mapped) {
    type = mapped.type;
  } else if (/\bteren|lot(uri)?\b/.test(t)) type = "teren";
  else if (/\bgarsonier/.test(t)) type = "garsoniera";
  else if (/\b(spa[tț]iu|comercial|birou|hal[aă]|depozit|industrial)\b/.test(t))
    type = "spatiu_comercial";
  else if (/\bcas[aă]|vil[aă]|pensiune\b/.test(t)) type = "casa";
  else type = "apartament";

  let txn: TransactionType;
  if (mapped) {
    txn = mapped.txn;
  } else if (
    /\b(de\s+)?(inchiriat|închiriat|inchiriere|închiriere|chirie|regim hotelier)\b/.test(t)
  ) {
    txn = "inchiriere";
  } else txn = "vanzare";

  return { type, txn };
}

function normalizeOffer(offer: OlxOffer): RawListing | null {
  if (!offer?.id || !offer.url) return null;
  const price = getParam(offer, "price");
  const surfaceRaw = getParam(offer, "m");
  const landRaw = getParam(offer, "suprafata_teren");
  const { type, txn } = resolveTypeTxn(offer);

  const images = (offer.photos ?? [])
    .map((p) => p.link?.replace("{width}x{height}", "800x600"))
    .filter((x): x is string => !!x);

  return {
    source: "OLX",
    externalId: `olx-${offer.id}`,
    url: offer.url,
    title: offer.title ?? "",
    description: (offer.description ?? "").replace(/<[^>]+>/g, " ").trim(),
    price: typeof price?.value === "number" ? price.value : null,
    currency: price?.currency === "EUR" ? "EUR" : "RON",
    surfaceM2: surfaceRaw?.key ? Number(surfaceRaw.key) || null : null,
    landSurfaceM2: landRaw?.key ? Number(landRaw.key) || null : null,
    rooms: parseRooms(getParam(offer, "rooms")),
    floor: parseFloor(getParam(offer, "floor")?.key),
    city: offer.location?.city?.name ?? null,
    propertyType: type,
    transactionType: txn,
    ownerType: offer.business ? "AG" : "PF",
    ownerName: offer.user?.company_name || offer.user?.name || null,
    phone: null, // OLX gates phone behind auth
    images,
    lat: typeof offer.map?.lat === "number" ? offer.map.lat : null,
    lon: typeof offer.map?.lon === "number" ? offer.map.lon : null,
    postedAt: offer.created_time ?? null,
  };
}

/** Fetch real-estate listings within the Făgăraș radius from OLX. */
export async function fetchOlx(maxPages = 5): Promise<SourceResult> {
  const listings: RawListing[] = [];
  let total = 0;
  try {
    for (let page = 0; page < maxPages; page++) {
      const limit = 50;
      const offset = page * limit;
      const url =
        `https://www.olx.ro/api/v1/offers/?offset=${offset}&limit=${limit}` +
        `&category_id=${OLX.categoryId}&city_id=${OLX.cityId}&distance=${OLX.distanceKm}` +
        `&sort_by=created_at%3Adesc`;
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`OLX HTTP ${res.status}`);
      const json = (await res.json()) as {
        data?: OlxOffer[];
        metadata?: { total_elements?: number };
      };
      total = json.metadata?.total_elements ?? total;
      const batch = (json.data ?? [])
        .map(normalizeOffer)
        .filter((x): x is RawListing => x !== null);
      listings.push(...batch);
      if ((json.data?.length ?? 0) < limit) break; // last page
    }
    return { source: "OLX", listings, total, ok: true };
  } catch (e) {
    return {
      source: "OLX",
      listings,
      total,
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
