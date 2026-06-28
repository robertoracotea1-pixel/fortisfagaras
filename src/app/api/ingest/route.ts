import { NextResponse } from "next/server";
import { ingestListings } from "@/lib/sources/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Scrapes all sources and upserts them into Supabase (tracking price changes).
 * Triggered by the Vercel cron (see vercel.json) or manually with the secret.
 * Protected by CRON_SECRET: Vercel cron sends it as a Bearer token; manual
 * calls can pass ?token=<secret>.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    const token = new URL(req.url).searchParams.get("token");
    if (auth !== `Bearer ${secret}` && token !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await ingestListings();
    return NextResponse.json({ ok: true, at: new Date().toISOString(), ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
