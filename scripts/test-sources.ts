// Standalone smoke test for source adapters. Run: npx tsx scripts/test-sources.ts [olx|publi24|storia|all]
import { fetchOlx } from "../src/lib/sources/olx";
import { fetchPubli24 } from "../src/lib/sources/publi24";
import { fetchStoria } from "../src/lib/sources/storia";

async function run(which: string) {
  const results = [];
  if (which === "olx" || which === "all") results.push(await fetchOlx(2));
  if (which === "publi24" || which === "all") results.push(await fetchPubli24(2));
  if (which === "storia" || which === "all") results.push(await fetchStoria());

  for (const r of results) {
    console.log(`\n===== ${r.source} =====`);
    console.log(`ok=${r.ok} total=${r.total} fetched=${r.listings.length}${r.error ? " error=" + r.error : ""}`);
    const pf = r.listings.filter((l) => l.ownerType === "PF").length;
    const ag = r.listings.filter((l) => l.ownerType === "AG").length;
    console.log(`PF=${pf} AG=${ag}`);
    for (const l of r.listings.slice(0, 6)) {
      console.log(
        `  · [${l.ownerType}] ${l.title.slice(0, 42).padEnd(42)} | ${l.price ?? "?"} ${l.currency} | ${l.propertyType}/${l.transactionType} | ${l.surfaceM2 ?? "?"}m² | ${l.city ?? "?"} | imgs:${l.images.length}`,
      );
    }
  }
}

run(process.argv[2] ?? "all").catch((e) => {
  console.error(e);
  process.exit(1);
});
