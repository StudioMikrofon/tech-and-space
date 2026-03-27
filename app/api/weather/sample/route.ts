import { NextRequest, NextResponse } from "next/server";
import { getLiveWeatherSample } from "@/lib/weather-live";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const latParam = Number(req.nextUrl.searchParams.get("lat"));
  const lonParam = Number(req.nextUrl.searchParams.get("lon"));

  if (!Number.isFinite(latParam) || !Number.isFinite(lonParam)) {
    return NextResponse.json({ ok: false, error: "lat and lon are required" }, { status: 400 });
  }

  const lat = Math.min(90, Math.max(-90, latParam));
  const lon = Math.min(180, Math.max(-180, lonParam));
  const sample = await getLiveWeatherSample(lat, lon);

  return NextResponse.json(
    { ok: true, data: sample, source: "open-meteo" },
    { headers: { "Cache-Control": "s-maxage=900, stale-while-revalidate=1800" } }
  );
}
