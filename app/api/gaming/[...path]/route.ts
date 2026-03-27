import { NextRequest, NextResponse } from "next/server";

const GAMING_SERVICE = "http://localhost:8766";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const url = `${GAMING_SERVICE}/${path.join("/")}`;

  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `Service error: ${res.status}` }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Gaming intel service unavailable" }, { status: 503 });
  }
}
