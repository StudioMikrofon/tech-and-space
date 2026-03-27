import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

const PYTHON = "/opt/openclaw/futurepulse/venv/bin/python3";
const FP_DIR = "/opt/openclaw/futurepulse";

// POST /api/image-pull { id: number, queryVariation?: number }
// Runs WebImagePuller for the given article — pulls images from web sources
// (source og:image → Wikimedia → Unsplash), downloads locally, updates DB.
// Runs async/detached — caller should poll for new images via /api/foto-review?id=X.
export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_AGENT_PANEL !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, queryVariation } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing article id" }, { status: 400 });
  const variation = Number.isFinite(Number(queryVariation)) ? Number(queryVariation) : Date.now();

  const script = `
import sys, asyncio, logging
sys.path.insert(0, '.')
logging.basicConfig(
    filename='logs/image_pull.log',
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
)
from agents.web_image_puller import WebImagePuller

async def run():
    puller = WebImagePuller()
    result = await puller.pull(${id}, query_variation=${variation})
    status = "OK" if result.get("ok") else "FAIL"
    print(f"[pull #{${id}}] {status}: {result.get('message') or result.get('error')}")

asyncio.run(run())
`;

  const proc = spawn(PYTHON, ["-c", script], {
    cwd: FP_DIR,
    detached: true,
    stdio: "ignore",
  });
  proc.unref();

  return NextResponse.json({
    ok: true,
    message: `Povlačenje web slika pokrenuto za #${id} (~15s)`,
  });
}
