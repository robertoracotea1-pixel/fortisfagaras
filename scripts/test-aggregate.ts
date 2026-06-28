import { aggregateListings, dashboardStatsFromProperties } from "../src/lib/sources/aggregate";

async function main() {
const props = await aggregateListings();
console.log(`Total properties (after dedup): ${props.length}`);
const dupes = props.filter((p) => p.isDuplicate);
console.log(`Cross-source duplicates merged: ${dupes.length}`);
console.log(`PF: ${props.filter((p) => p.ownerType === "PF").length} | AG: ${props.filter((p) => p.ownerType === "AG").length}`);
console.log(`New (48h): ${props.filter((p) => p.isNew).length}`);
console.log(`With images: ${props.filter((p) => p.images.length > 0).length} | With geo city: ${props.filter((p) => p.city !== "Necunoscut").length}`);

console.log("\n--- sample cross-source duplicates ---");
for (const p of dupes.slice(0, 4)) {
  console.log(`  [${p.ownerType}] ${p.title.slice(0, 40)} | ${p.price} ${p.currency} | ${p.city} | sources: ${p.sources.map((s) => s.platform).join("+")}`);
}

console.log("\n--- sample listings ---");
for (const p of props.slice(0, 8)) {
  console.log(`  [${p.ownerType}] ${p.title.slice(0, 38).padEnd(38)} | ${p.price} ${p.currency} | ${p.type}/${p.transactionType} | ${p.city} | ${p.sources.map((s) => s.platform).join("+")}`);
}

console.log("\n--- dashboard stats ---");
console.log(JSON.stringify(dashboardStatsFromProperties(props), null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
