// Geographic config for the Făgăraș catchment area (~20 km radius).

/** Făgăraș town center (from OLX geo data). */
export const FAGARAS_CENTER = { lat: 45.8416, lon: 24.9731 };
export const RADIUS_KM = 20;

/** OLX-specific identifiers (verified live against the offers API). */
export const OLX = {
  cityId: 28291, // Făgăraș
  categoryId: 3, // Imobiliare (parent)
  distanceKm: RADIUS_KM,
};

/**
 * Localities within ~20 km of Făgăraș. Used to filter Publi24/Storia results,
 * which don't expose a clean radius filter. Stored normalized (no diacritics,
 * lowercase) for matching.
 */
const LOCALITIES_RAW = [
  "Făgăraș",
  "Victoria",
  "Șercaia",
  "Voila",
  "Recea",
  "Mândra",
  "Hârseni",
  "Beclean",
  "Părău",
  "Comăna",
  "Comăna de Jos",
  "Comăna de Sus",
  "Șinca",
  "Șinca Veche",
  "Șinca Nouă",
  "Veneția de Jos",
  "Veneția de Sus",
  "Sâmbăta de Jos",
  "Sâmbăta de Sus",
  "Drăguș",
  "Viștea",
  "Viștea de Jos",
  "Viștea de Sus",
  "Lisa",
  "Breaza",
  "Ludișor",
  "Hurez",
  "Voivodeni",
  "Galați",
  "Pojorta",
  "Ucea",
  "Ucea de Jos",
  "Ucea de Sus",
  "Corbi",
  "Calbor",
  "Cuciulata",
  "Hoghiz",
  "Dridif",
  "Săsciori",
  "Hărman",
];

/** Remove diacritics + lowercase, for tolerant locality matching. */
export function normalizeLocality(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

const LOCALITY_SET = new Set(LOCALITIES_RAW.map(normalizeLocality));

/** True when a free-text location string mentions a locality in the catchment. */
export function isInCatchment(location: string | null | undefined): boolean {
  if (!location) return false;
  const norm = normalizeLocality(location);
  for (const loc of LOCALITY_SET) {
    if (norm.includes(loc)) return true;
  }
  return false;
}

/** Haversine distance in km between two lat/lon points. */
export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
