import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

const PYTHON = "/opt/openclaw/futurepulse/venv/bin/python3";
const FP_DIR = "/opt/openclaw/futurepulse";

// POST /api/image-press { id?: number, ids?: number[] }
// Runs PressImageFinder for given article(s) — discovers official press images.
// Runs async/detached — caller should poll for new images via /api/foto-review?id=X.
export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_AGENT_PANEL !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, ids } = body;

  // Support both single article and batch
  const article_ids: number[] = ids ? (Array.isArray(ids) ? ids : [ids]) : id ? [id] : [];
  if (!article_ids.length) {
    return NextResponse.json({ error: "Missing article id or ids" }, { status: 400 });
  }

  const script = `
import sys, asyncio, logging
sys.path.insert(0, '.')
logging.basicConfig(
    filename='logs/image_press.log',
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
)
from agents.press_image_finder import PressImageFinder

async def run():
    finder = PressImageFinder()
    article_ids = ${JSON.stringify(article_ids)}

    if len(article_ids) == 1:
        # Single article
        result = await finder.find_for_article(article_ids[0])
        status = result.get('status', 'none')
        msg = result.get('message') or result.get('error') or 'unknown'
        print(f"[press #{article_ids[0]}] {status}: {msg}")
    else:
        # Batch
        stats = await finder.run_batch(article_ids, concurrency=3)
        print(f"[press batch] found={stats.get('found')}, partial={stats.get('partial')}, none={stats.get('none')}, errors={stats.get('errors')}")

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
      ? `Pronalaženje press slika pokrenuto za #${article_ids[0]} (~5s)`
      : `Pronalaženje press slika pokrenuto za ${article_ids.length} članaka (~15-30s)`;

  return NextResponse.json({
    ok: true,
    message: msg,
  });
}
