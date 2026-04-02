import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

const PYTHON = "/opt/openclaw/futurepulse/venv/bin/python3";
const FP_DIR = "/opt/openclaw/futurepulse";

// POST /api/image-pull { id?: number, ids?: number[], queryVariation?: number }
// Runs WebImagePuller for given article(s) — pulls images from web sources
// (source og:image → Wikimedia → Unsplash → Pexels → Pixabay)
// Runs async/detached — caller should poll for new images via /api/foto-review?id=X.
export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_AGENT_PANEL !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, ids, queryVariation } = body;

  // Support both single article and batch
  const article_ids: number[] = ids ? (Array.isArray(ids) ? ids : [ids]) : id ? [id] : [];
  if (!article_ids.length) {
    return NextResponse.json({ error: "Missing article id or ids" }, { status: 400 });
  }

  const variation = Number.isFinite(Number(queryVariation)) ? Number(queryVariation) : Date.now();

  const script = `
import sys, asyncio, logging
sys.path.insert(0, '.')
logging.basicConfig(
    filename='logs/image_pull.log',
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
)
from core.web_image_puller import WebImagePuller

async def run():
    puller = WebImagePuller()
    article_ids = ${JSON.stringify(article_ids)}

    if len(article_ids) == 1:
        # Single article
        result = await puller.pull(article_ids[0], query_variation=${variation})
        status = "OK" if result.get("ok") else "FAIL"
        print(f"[pull #{article_ids[0]}] {status}: {result.get('message') or result.get('error')}")
    else:
        # Batch
        stats = {'found': 0, 'partial': 0, 'none': 0, 'errors': 0}
        for aid in article_ids:
            result = await puller.pull(aid, query_variation=${variation})
            if result.get('ok'):
                if result.get('images_count', 0) >= 2:
                    stats['found'] += 1
                elif result.get('images_count', 0) > 0:
                    stats['partial'] += 1
                else:
                    stats['none'] += 1
            else:
                stats['errors'] += 1
        print(f"[pull batch] found={stats['found']}, partial={stats['partial']}, none={stats['none']}, errors={stats['errors']}")

asyncio.run(run())
`;

  const proc = spawn(PYTHON, ["-c", script], {
    cwd: FP_DIR,
    detached: true,
    stdio: "ignore",
  });
  proc.unref();

  const msg =
    article_ids.length === 1
      ? `Povlačenje web slika pokrenuto za #${article_ids[0]} (~15s)`
      : `Povlačenje web slika pokrenuto za ${article_ids.length} članaka (~20-30s)`;

  return NextResponse.json({
    ok: true,
    message: msg,
  });
}
