import { NextResponse } from "next/server";
import { getGlobePins } from "@/lib/content";

export async function GET() {
  try {
    const pins = getGlobePins();
    return NextResponse.json(pins);
  } catch {
    return NextResponse.json([]);
  }
}
