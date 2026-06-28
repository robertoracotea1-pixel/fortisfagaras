import type { PropertyType, TransactionType } from "@/lib/types";
import type { RawListing, SourceResult } from "./types";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

// Publi24 filters by locality via URL path. Făgăraș city carries the bulk of
// the catchment; a few nearby towns are queried too. Each is a Brașov-county slug.
const LOCALITY_SLUGS = ["fagaras", "victoria", "sercaia"];
const TXNS: { slug: string; txn: TransactionType }[] = [
  { slug: "de-vanzare", txn: "vanzare" },
  { slug: "de-inchiriat", txn: "inchiriere" },
];

const AGENCY_RE =
  /\b(agentia|agenție|agentie|imobiliar[ăa]?|broker|s\.?r\.?l\.?|real estate|comision 0)\b/i;

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function typeFromUrl(url: string): PropertyType {
  if (/\/terenuri\//.test(url)) return "teren";
  if (/\/garsoniere\//.test(url)) return "garsoniera";
  if (/\/case\b|\/case-vile\//.test(url)) return "casa";
  if (/\/spatii-comerciale\/|\/birouri\/|\/hale-spatii-industriale\//.test(url))
    return "spatiu_comercial";
  if (/\/apartamente\//.test(url)) return "apartament";
  return "apartament";
}

function parsePrice(block: string): { price: number | null; currency: "EUR" | "RON" } {
  const m = block.match(/class="article-price">\s*([\d.,\s]+)\s*(EUR|€|lei|RON)/i);
  if (!m) return { price: null, currency: "EUR" };
  const num = Number(m[1].replace(/[.,\s]/g, ""));
  const cur = /eur|€/i.test(m[2]) ? "EUR" : "RON";
  return { price: Number.isFinite(num) && num > 0 ? num : null, currency: cur };
}

function parseBlock(block: string, txn: TransactionType): RawListing | null {
  const idM = block.match(/^data-articleid="([^"]+)"/);
  const urlM =
    block.match(/location\.href='([^']+)'/) ||
    block.match(/class="article-title">\s*<a href="([^"]+)"/);
  if (!idM || !urlM) return null;
  const url = urlM[1];

  const titleM =
    block.match(/class="article-title">\s*<a[^>]*>\s*([^<]+?)\s*<\/a>/) ||
    block.match(/<img[^>]*alt="([^"]+)"/);
  const title = titleM ? stripTags(titleM[1]) : "";

  const descM = block.match(/class="article-description"[^>]*>([\s\S]*?)<\/div>/);
  const description = descM ? stripTags(descM[1]) : "";

  const locM = block.match(/class="article-location"[^>]*>([\s\S]*?)<\/p>/);
  const city = locM ? stripTags(locM[1]) || null : null;

  const imgM = block.match(/class="art-img"[\s\S]*?<img[^>]*src="([^"]+)"/);
  const images = imgM ? [imgM[1]] : [];

  const { price, currency } = parsePrice(block);
  const isAgency = AGENCY_RE.test(title + " " + description);

  return {
    source: "Publi24",
    externalId: `publi24-${idM[1].toLowerCase()}`,
    url,
    title,
    description,
    price,
    currency,
    surfaceM2: (() => {
      const s = (title + " " + description).match(/(\d{2,4})\s*mp\b/i);
      return s ? Number(s[1]) : null;
    })(),
    landSurfaceM2: null,
    rooms: (() => {
      const r = (title + " " + url).match(/(\d+)\s*camere|apartamente-(\d+)-camere/i);
      return r ? Number(r[1] ?? r[2]) : null;
    })(),
    floor: null,
    city,
    propertyType: typeFromUrl(url),
    transactionType: txn,
    ownerType: isAgency ? "AG" : "unknown",
    ownerName: null,
    phone: null,
    images,
    lat: null,
    lon: null,
    postedAt: null,
  };
}

async function fetchPage(localitySlug: string, txnSlug: string, txn: TransactionType, page: number) {
  const q = page > 1 ? `?pagina=${page}` : "";
  const url = `https://www.publi24.ro/anunturi/imobiliare/${txnSlug}/brasov/${localitySlug}/${q}`;
  const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!res.ok) return { listings: [] as RawListing[], hasMore: false };
  const html = await res.text();
  const blocks = html.split(/(?=data-articleid=")/).filter((b) => b.startsWith("data-articleid="));
  const listings = blocks
    .map((b) => parseBlock(b, txn))
    .filter((x): x is RawListing => x !== null);
  // crude "has more": a full page typically has >= 20 organic items
  return { listings, hasMore: blocks.length >= 20 };
}

/** Fetch Făgăraș-area listings from Publi24 (HTML scrape). */
export async function fetchPubli24(maxPagesPerQuery = 2): Promise<SourceResult> {
  const listings: RawListing[] = [];
  try {
    for (const loc of LOCALITY_SLUGS) {
      for (const { slug, txn } of TXNS) {
        for (let page = 1; page <= maxPagesPerQuery; page++) {
          const { listings: batch, hasMore } = await fetchPage(loc, slug, txn, page);
          listings.push(...batch);
          if (!hasMore) break;
        }
      }
    }
    // Dedup within source (promoted ads repeat across pages).
    const seen = new Set<string>();
    const unique = listings.filter((l) =>
      seen.has(l.externalId) ? false : (seen.add(l.externalId), true),
    );
    return { source: "Publi24", listings: unique, total: unique.length, ok: true };
  } catch (e) {
    return {
      source: "Publi24",
      listings,
      total: listings.length,
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
