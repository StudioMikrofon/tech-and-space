import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import { spawn } from "child_process";

const DB_PATH = "/opt/openclaw/futurepulse/db/futurepulse.db";

function checkAuth(req: NextRequest): boolean {
  if (process.env.NEXT_PUBLIC_AGENT_PANEL !== "true") return false;
  return true;
}

function getDb() {
  return new Database(DB_PATH, { readonly: false });
}

function triggerImageGen(articleIds: number[]) {
  const idsJson = JSON.stringify(articleIds);
  const script = `
import sys, asyncio, logging
sys.path.insert(0, '.')
logging.basicConfig(filename='logs/review_images.log', level=logging.INFO)
from agents.image_gen import ImageGenerator
from core.db import Database

async def run():
    gen = ImageGenerator()
    db = Database()
    for aid in ${idsJson}:
        try:
            conn = db.get_conn()
            row = conn.execute('SELECT id, title, title_en, subtitle, subtitle_en, category, part1, part1_en, part2, part2_en FROM articles WHERE id=?', (aid,)).fetchone()
            conn.close()
            if not row:
                continue
            result = await gen.generate_for_article(dict(row))
            if result and result.get('success'):
                logging.info(f'Images OK for #{aid}')
            else:
                logging.warning(f'Image gen no result for #{aid}')
        except Exception as e:
            logging.error(f'Image gen error #{aid}: {e}')

asyncio.run(run())
`;
  const proc = spawn(
    "/opt/openclaw/futurepulse/venv/bin/python3",
    ["-c", script],
    { cwd: "/opt/openclaw/futurepulse", detached: true, stdio: "ignore" }
  );
  proc.unref();
}

// GET /api/review — list articles
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const filter = url.searchParams.get("filter") || "pending";

  try {
    const db = getDb();
    let query = `
      SELECT id, title, title_en, category, status, pipeline_stage, approved,
             github_uploaded, chosen_ending, part1, part1_en,
             part2, part2_en, subtitle, subtitle_en,
             endings_json, endings_en, images_json,
             source_url, source_name, created_at, published_at,
             exec_summary
      FROM articles
    `;
    if (filter === "pending") {
      query += ` WHERE status NOT IN ('rejected', 'published', 'approved') ORDER BY id DESC LIMIT 100`;
    } else if (filter === "published") {
      query += ` WHERE status='published' ORDER BY id DESC LIMIT 50`;
    } else {
      query += ` WHERE status NOT IN ('rejected', 'approved') ORDER BY id DESC LIMIT 100`;
    }
    const rows = db.prepare(query).all();
    db.close();
    return NextResponse.json({ articles: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH /api/review — save edits
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { id, title, title_en, part1, part1_en, part2, part2_en, subtitle, subtitle_en } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const db = getDb();
    db.prepare(`
      UPDATE articles SET
        title = COALESCE(?, title),
        title_en = COALESCE(?, title_en),
        part1 = COALESCE(?, part1),
        part1_en = COALESCE(?, part1_en),
        part2 = COALESCE(?, part2),
        part2_en = COALESCE(?, part2_en),
        subtitle = COALESCE(?, subtitle),
        subtitle_en = COALESCE(?, subtitle_en)
      WHERE id = ?
    `).run(
      title ?? null, title_en ?? null,
      part1 ?? null, part1_en ?? null,
      part2 ?? null, part2_en ?? null,
      subtitle ?? null, subtitle_en ?? null,
      id
    );
    db.close();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/review — publish, reject, bulk_publish, bulk_reject
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { id, action, chosen_ending, ids, reason } = body;

    // --- Bulk actions ---
    if (action === "bulk_reject") {
      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "Missing ids" }, { status: 400 });
      }
      const db = getDb();
      const stmt = db.prepare("UPDATE articles SET status='rejected' WHERE id=?");
      let count = 0;
      for (const articleId of ids) {
        stmt.run(articleId);
        count++;
      }
      db.close();
      return NextResponse.json({ ok: true, count });
    }

    if (action === "bulk_approve" || action === "bulk_approve_random") {
      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "Missing ids" }, { status: 400 });
      }
      const useRandom = action === "bulk_approve_random";
      const endings = ["A", "B", "C"];
      const db = getDb();
      const stmtEnding = db.prepare(
        "UPDATE articles SET approved=1, status='approved', pipeline_stage='images_pending', chosen_ending=? WHERE id=?"
      );
      const stmtNoEnding = db.prepare(
        "UPDATE articles SET approved=1, status='approved', pipeline_stage='images_pending' WHERE id=?"
      );
      const toApprove: number[] = [];
      for (const articleId of ids) {
        if (useRandom) {
          const row = db.prepare("SELECT chosen_ending FROM articles WHERE id=?").get(articleId) as { chosen_ending: string | null } | undefined;
          const ending = row?.chosen_ending || endings[Math.floor(Math.random() * 3)];
          stmtEnding.run(ending, articleId);
        } else {
          stmtNoEnding.run(articleId);
        }
        toApprove.push(articleId);
      }
      db.close();
      triggerImageGen(toApprove);
      return NextResponse.json({ ok: true, count: toApprove.length });
    }

    // Legacy aliases for old bulk actions
    if (action === "bulk_publish") {
      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "Missing ids" }, { status: 400 });
      }
      const db = getDb();
      const toApprove: number[] = [];
      for (const articleId of ids) {
        db.prepare("UPDATE articles SET approved=1, status='approved', pipeline_stage='images_pending' WHERE id=?").run(articleId);
        toApprove.push(articleId);
      }
      db.close();
      triggerImageGen(toApprove);
      return NextResponse.json({ ok: true, count: toApprove.length });
    }

    if (action === "bulk_publish_random") {
      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "Missing ids" }, { status: 400 });
      }
      const endings = ["A", "B", "C"];
      const db = getDb();
      const toApprove: number[] = [];
      for (const articleId of ids) {
        const row = db.prepare("SELECT chosen_ending FROM articles WHERE id=?").get(articleId) as { chosen_ending: string | null } | undefined;
        const ending = row?.chosen_ending || endings[Math.floor(Math.random() * 3)];
        db.prepare("UPDATE articles SET approved=1, status='approved', pipeline_stage='images_pending', chosen_ending=? WHERE id=?").run(ending, articleId);
        toApprove.push(articleId);
      }
      db.close();
      triggerImageGen(toApprove);
      return NextResponse.json({ ok: true, count: toApprove.length });
    }

    // --- Single actions ---
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const db = getDb();

    if (action === "reject") {
      db.prepare("UPDATE articles SET status='rejected', reject_reason=? WHERE id=?").run(reason ?? null, id);
      db.close();
      return NextResponse.json({ ok: true, message: "Odbijen" });
    }

    // Approve: mark approved + save chosen_ending + trigger image generation
    db.prepare(
      "UPDATE articles SET approved=1, status='approved', pipeline_stage='images_pending', chosen_ending=? WHERE id=?"
    ).run(chosen_ending ?? null, id);
    db.close();

    triggerImageGen([id]);

    return NextResponse.json({ ok: true, message: "Odobreno — generiranje slika u pozadini (~2 min)" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
