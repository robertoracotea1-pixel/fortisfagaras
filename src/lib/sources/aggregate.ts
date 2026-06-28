import type {
  Property,
  Owner,
  PropertySource,
  Platform,
  PriceHistory,
  DashboardStats,
} from "@/lib/types";
import type { RawListing } from "./types";
import { fetchOlx } from "./olx";
import { fetchPubli24 } from "./publi24";
import { fetchStoria } from "./storia";
import { normalizeLocality } from "./geo";

/** Run all source adapters in parallel and return the raw (un-merged) listings. */
export async function fetchAllRaw(): Promise<RawListing[]> {
  const results = await Promise.all([fetchOlx(4), fetchPubli24(2), fetchStoria()]);
  return results.flatMap((r) => r.listings);
}

const EUR_PER_RON = 0.2; // rough, only for dedup bucketing

function toEur(price: number | null, currency: "EUR" | "RON"): number | null {
  if (price == null) return null;
  return currency === "EUR" ? price : Math.round(price * EUR_PER_RON);
}

/** Coarse fingerprint used to detect the same property across sources. */
function fingerprint(l: RawListing): string {
  const eur = toEur(l.price, l.currency);
  const priceBucket = eur != null ? Math.round(eur / 2000) : "x";
  const surfaceBucket = l.surfaceM2 != null ? Math.round(l.surfaceM2 / 5) : "x";
  const cityNorm = l.city ? normalizeLocality(l.city.split(",")[0]) : "x";
  return [
    l.propertyType,
    l.transactionType,
    l.rooms ?? "x",
    surfaceBucket,
    cityNorm,
    priceBucket,
  ].join("|");
}

/** Clean a free-text location ("central, Fagaras, Brasov") down to the locality. */
function cleanCity(city: string | null): string {
  if (!city) return "Necunoscut";
  const parts = city.split(",").map((p) => p.trim());
  // Prefer the part that isn't the county ("Brasov") nor a neighborhood adjective.
  const known = parts.find((p) => /f[ăa]g[ăa]ra|victoria|[șs]ercaia|voila|comana|[șs]inca|vene[țt]ia|s[âa]mb[ăa]ta|recea|m[âa]ndra|h[âa]rseni|beclean|p[ăa]r[ăa]u|dr[ăa]gu[șs]|vi[șs]tea|lisa|breaza|ucea|galati/i.test(p));
  return known ?? parts[0] ?? "Necunoscut";
}

/** Confidence (0–1) that the owner classification is correct. */
function pfConfidence(l: RawListing): number {
  // OLX `business` and Storia `isPrivateOwner` are authoritative source flags.
  if (l.source === "OLX" || l.source === "Storia") return 0.95;
  // Publi24 is keyword-inferred.
  return l.ownerType === "unknown" ? 0.55 : 0.7;
}

const SOURCE_RANK: Record<RawListing["source"], number> = {
  Storia: 3, // richest structured data
  OLX: 2,
  Publi24: 1,
};

function isRecent(iso: string | null, hours: number): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < hours * 3600_000;
}

function mergeGroup(
  group: RawListing[],
  phMap?: Map<string, PriceHistory[]>,
): Property {
  // Primary = richest source, then most images.
  const primary = [...group].sort(
    (a, b) =>
      SOURCE_RANK[b.source] - SOURCE_RANK[a.source] ||
      b.images.length - a.images.length,
  )[0];

  const images = Array.from(new Set(group.flatMap((l) => l.images)));
  // One source entry per platform (a group can hold near-dupes from one portal).
  const byPlatform = new Map<Platform, PropertySource>();
  for (const l of group) {
    const platform = l.source as Platform;
    if (!byPlatform.has(platform)) {
      byPlatform.set(platform, {
        platform,
        url: l.url,
        lastScraped: new Date().toISOString(),
      });
    }
  }
  const sources: PropertySource[] = Array.from(byPlatform.values());

  // Owner type: trust authoritative sources (OLX/Storia) over Publi24 keywords.
  const authoritative = group.find((l) => l.source === "OLX" || l.source === "Storia");
  const ownerSrc = authoritative ?? primary;
  const ownerType = ownerSrc.ownerType === "unknown" ? "PF" : ownerSrc.ownerType;
  const confidence = Math.max(...group.map(pfConfidence));

  const postedDates = group
    .map((l) => l.postedAt)
    .filter((d): d is string => !!d)
    .sort();
  const firstSeenAt = postedDates[0] ?? new Date().toISOString();
  const ownerName = group.map((l) => l.ownerName).find((n) => !!n) ?? null;

  const owner: Owner = {
    id: `owner-${primary.externalId}`,
    name: ownerName,
    phone: group.map((l) => l.phone).find((p) => !!p) ?? "—",
    type: ownerType,
    confidence,
    firstSeenAt,
    totalProperties: 1,
  };

  // Prefer the primary's price; fall back to any source that has one.
  const priced = primary.price != null && primary.price > 0
    ? primary
    : group.find((l) => l.price != null && l.price > 0) ?? primary;
  const price = priced.price ?? 0;

  // Real price history from the DB (per source external_id), else a single point.
  let priceHistory: PriceHistory[] = [{ price, date: firstSeenAt }];
  if (phMap) {
    const merged = group
      .flatMap((l) => phMap.get(l.externalId) ?? [])
      .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    if (merged.length > 0) {
      priceHistory = merged.map((h, i) => {
        const prev = merged[i - 1]?.price;
        return prev && prev > 0
          ? { ...h, changePct: Math.round(((h.price - prev) / prev) * 100) }
          : h;
      });
    }
  }

  return {
    id: primary.externalId,
    title: primary.title,
    description: primary.description,
    type: primary.propertyType,
    transactionType: primary.transactionType,
    price,
    currency: priced.currency,
    surfaceM2: primary.surfaceM2 ?? 0,
    rooms: primary.rooms,
    floor: primary.floor,
    totalFloors: null,
    city: cleanCity(primary.city),
    street: null,
    ownerType,
    owner,
    sources,
    images,
    priceHistory,
    firstSeenAt,
    lastUpdatedAt: new Date().toISOString(),
    isNew: isRecent(firstSeenAt, 48),
    isDuplicate: sources.length > 1,
    aiPfScore: ownerType === "PF" ? confidence : 1 - confidence,
  };
}

/** Dedup raw listings across sources and merge into UI-ready properties. */
export function mergeListings(
  all: RawListing[],
  phMap?: Map<string, PriceHistory[]>,
): Property[] {
  const groups = new Map<string, RawListing[]>();
  for (const l of all) {
    const fp = fingerprint(l);
    const arr = groups.get(fp);
    if (arr) arr.push(l);
    else groups.set(fp, [l]);
  }

  const properties = Array.from(groups.values()).map((g) => mergeGroup(g, phMap));
  // Newest first.
  properties.sort((a, b) => Date.parse(b.firstSeenAt) - Date.parse(a.firstSeenAt));
  return properties;
}

/** Live path: fetch all sources, dedup, and return UI-ready properties. */
export async function aggregateListings(): Promise<Property[]> {
  return mergeListings(await fetchAllRaw());
}

/** Compute dashboard stats from a set of properties. */
export function dashboardStatsFromProperties(props: Property[]): DashboardStats {
  const platforms: Platform[] = ["OLX", "Storia", "Publi24"];
  const sourceBreakdown = platforms.map((source) => ({
    source,
    count: props.filter((p) => p.sources.some((s) => s.platform === source)).length,
  }));

  const newToday = props.filter((p) => isRecent(p.firstSeenAt, 24)).length;
  const pfToday = props.filter((p) => p.ownerType === "PF" && isRecent(p.firstSeenAt, 24)).length;

  // Last 7 days histogram of first-seen.
  const weeklyNew = Array.from({ length: 7 }, (_, i) => {
    const dayStart = Date.now() - (6 - i) * 86400_000;
    return props.filter((p) => {
      const t = Date.parse(p.firstSeenAt);
      return !Number.isNaN(t) && t >= dayStart && t < dayStart + 86400_000;
    }).length;
  });

  return {
    newToday,
    pfToday,
    uncontacted: props.filter((p) => p.ownerType === "PF").length,
    contacted: 0,
    activeSources: sourceBreakdown.filter((s) => s.count > 0).length,
    totalProperties: props.length,
    weeklyNew,
    sourceBreakdown,
  };
}
