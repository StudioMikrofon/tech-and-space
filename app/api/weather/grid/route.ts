import { NextResponse } from "next/server";
import { getLiveWeatherGrid } from "@/lib/weather-live";

export const dynamic = "force-dynamic";

export async function GET() {
  const grid = await getLiveWeatherGrid();

  return NextResponse.json(
    { ok: true, data: grid, source: grid.source },
    { headers: { "Cache-Control": "s-maxage=900, stale-while-revalidate=1800" } },
  );
}
