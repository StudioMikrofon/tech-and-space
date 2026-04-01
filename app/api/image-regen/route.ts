import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { fotoReviewQueue } from "@/lib/foto-review-queue";

const PYTHON = "/opt/openclaw/futurepulse/venv/bin/python3";
const FP_DIR = "/opt/openclaw/futurepulse";

// ─── PROCESS TRACKING ─────────────────────────────────────────────────────
// All image-regen requests go through global foto-review queue for sequential processing
// GRACEFUL SHUTDOWN: kill pending requests if service is stopping
let isShuttingDown = false;
const activeProcesses = new Set<any>();

// Handle shutdown: kill pending requests so Node can exit cleanly
if (typeof process !== 'undefined' && process.on) {
  process.on('SIGTERM', () => {
    console.log("[image-regen] SIGTERM received, killing all active processes...");
    isShuttingDown = true;
    activeProcesses.forEach(proc => {
      try {
        // Destroy all streams first
        if (proc.stdout) proc.stdout.destroy();
        if (proc.stderr) proc.stderr.destroy();
        if (proc.stdin) proc.stdin.destroy();
        // Remove all listeners
        proc.removeAllListeners();
        // Kill the process and its children
        proc.kill('SIGKILL');
      } catch (e) {
        // process may have already exited
      }
    });
    activeProcesses.clear();
    console.log("[image-regen] Shutdown cleanup complete");
  });
}

export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_AGENT_PANEL !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, image_type, model, title, category } = await req.json();

  // model: "qwen" (default) | "openai" (explicit only)
  const provider  = model === "openai" ? '"openai"' : '"qwen"';
  const typeLabel = image_type ? `(${image_type})` : "(obje)";

  // ── PATH A: Pipeline article (has DB id) ──────────────────────────────────
  if (id) {
    // Enqueue in global foto-review queue for sequential processing
    return fotoReviewQueue.enqueue(`image-regen:${id}:${image_type || "both"}`, async () => {
      const regenType = image_type === "main" || image_type === "subtitle" ? `"${image_type}"` : "None";
      const script = `
import sys, asyncio, json
sys.path.insert(0, '.')
import logging
logging.basicConfig(
    filename='logs/image_regen.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

try:
    from agents.image_gen import ImageGenerator
    from core.db import Database

    async def run():
        try:
            db = Database()
            conn = db.get_conn()
            row = conn.execute(
                "SELECT id,title,title_en,subtitle,subtitle_en,category,part1,part1_en,part2,part2_en,body_md,source_url,original_urls FROM articles WHERE id=?",
                (${id},)
            ).fetchone()
            conn.close()

            if not row:
                logger.error(f"Article ${id} not found")
                print(json.dumps({"ok": False, "error": "Article not found"}))
                return

            try:
                article = dict(row)
            except (TypeError, AttributeError) as e:
                logger.error(f"Failed to convert row to dict for article ${id}: {e}. Row type: {type(row)}, Row: {row}")
                print(json.dumps({"ok": False, "error": f"Invalid article data: {str(e)[:100]}"}))
                return

            logger.info(f"Row converted to dict successfully. Type: {type(article)}, Keys: {list(article.keys()) if article else 'N/A'}")

            if not article:
                logger.error(f"Article dict is empty for article ${id}")
                print(json.dumps({"ok": False, "error": "Article dict is empty"}))
                return

            logger.info(f"Starting image regen for article ${id}: {article.get('title_en', 'N/A')[:50] if article.get('title_en') else 'N/A'}")

            gen = ImageGenerator()
            result = await gen.generate_for_article(
                article,
                regen_type=${regenType},
                force_provider=${provider}
            )

            # Always try to refresh images (even if subtitle failed, main might have succeeded)
            if result and (result.get("success") or result.get("image_main", {}).get("url")):
                logger.info(f"Generation result for article ${id}, calling refresh_article_images")
                print(json.dumps({"ok": True, "message": "Image generation completed"}))

                try:
                    from core.vps_publisher import refresh_article_images
                    refresh_result = refresh_article_images(${id})
                    logger.info(f"refresh_article_images result: {refresh_result}")
                except Exception as e:
                    logger.error(f"refresh_article_images failed: {e}")
            else:
                logger.warning(f"Generation FAILED for article ${id}: {result}")
                print(json.dumps({"ok": False, "error": f"Generation failed: {result}"}))
        except Exception as e:
            logger.error(f"Error in image regen: {e}", exc_info=True)
            print(json.dumps({"ok": False, "error": str(e)[:200]}))

    asyncio.run(run())
except Exception as e:
    logger.error(f"Fatal error: {e}", exc_info=True)
    print(json.dumps({"ok": False, "error": "Fatal error: " + str(e)[:100]}))
`;

      return new Promise<NextResponse>((resolve) => {
        let stdout = "";
        let stderr = "";
        let resolved = false;
        const proc = spawn(PYTHON, ["-c", script], { cwd: FP_DIR });
        activeProcesses.add(proc);

        proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
        proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });

        const cleanup = () => {
          activeProcesses.delete(proc);
        };

        proc.on("close", () => {
          cleanup();
          if (resolved) return;
          resolved = true;
          try {
            const trimmedStdout = stdout.trim();
            if (!trimmedStdout) {
              // Process crashed without outputting JSON — this is a real error
              const errorMsg = stderr.includes("error") || stderr.includes("Error") || stderr.includes("failed")
                ? stderr.slice(-200)
                : "Process completed with no output";
              console.error(`[image-regen] Fatal: article ${id} - no JSON output. stderr: ${errorMsg}`);
              resolve(NextResponse.json({
                ok: false,
                error: `Image generation failed: ${errorMsg.slice(-100)}`
              }, { status: 500 }));
              return;
            }

            // Python may output debug text before final JSON — parse LAST line as JSON
            const lines = trimmedStdout.split('\n').filter(l => l.trim());
            const lastLine = lines[lines.length - 1];
            if (!lastLine) throw new Error("No output lines");

            const result = JSON.parse(lastLine);
            resolve(NextResponse.json(result));
          } catch (e) {
            // JSON parse error — process crashed or output is malformed
            console.error(`[image-regen] Parse error for article ${id}:`, e instanceof Error ? e.message : String(e), "last stdout:", stdout.trim().split('\n').pop()?.slice(0, 100));
            resolve(NextResponse.json({
              ok: false,
              error: `Generation failed: invalid output`
            }, { status: 500 }));
          }
        });

        proc.on("error", (e: Error) => {
          cleanup();
          if (resolved) return;
          resolved = true;
          console.error("Image regen spawn error:", e);
          resolve(NextResponse.json({ ok: false, error: e.message }));
        });

        setTimeout(() => {
          if (resolved) return;
          resolved = true;
          proc.kill('SIGKILL');
          cleanup();
          resolve(NextResponse.json({ ok: true, message: "Regeneracija pokrenuta (~30s)" }));
        }, 120000);
      });
    });
  }

  // ── PATH B: No DB id — generate from title/category, return URL directly ──
  if (!title) return NextResponse.json({ error: "Missing id or title" }, { status: 400 });

  const safeTitle    = (title as string).replace(/'/g, "\\'").slice(0, 200);
  const safeCategory = ((category as string) || "tech").replace(/'/g, "\\'").slice(0, 30);
  const safeProvider = provider;

  // Enqueue in global foto-review queue
  return fotoReviewQueue.enqueue(`image-gen-title:${safeTitle.slice(0, 30)}`, async () => {
    const scriptB = `
import sys, asyncio, json
sys.path.insert(0, '.')
from core.api_pool import APIPool

async def run():
    pool = APIPool()
    prompt = f"Editorial photograph for tech news article: {repr('${safeTitle}')}. Category: ${safeCategory}. Cinematic lighting, dark sci-fi aesthetic, no text, no UI elements."
    result = await pool.generate_image(prompt, style='illustration', size='1024x576', force_provider=${safeProvider})
    print(json.dumps(result))

asyncio.run(run())
`;

  return new Promise<NextResponse>((resolve) => {
    let out = "";
    let resolved = false;
    const proc = spawn(PYTHON, ["-c", scriptB], { cwd: FP_DIR });
    activeProcesses.add(proc);

    proc.stdout.on("data", (d: Buffer) => { out += d.toString(); });

    const cleanup = () => {
      activeProcesses.delete(proc);
    };

    proc.on("close", async () => {
      cleanup();
      if (resolved) return;
      resolved = true;
      try {
        // Python may output debug text — parse LAST line as JSON
        const trimmedOut = out.trim();
        const lines = trimmedOut.split('\n').filter(l => l.trim());
        const lastLine = lines[lines.length - 1];
        if (!lastLine) throw new Error("No output lines");

        const result = JSON.parse(lastLine);
        if (result.url) {
          // Download and save locally so URL doesn't expire
          try {
            const imgRes = await fetch(result.url);
            if (imgRes.ok) {
              const buf = Buffer.from(await imgRes.arrayBuffer());
              const ext = result.url.includes(".png") ? "png" : "jpg";
              const filename = `gen-${Date.now()}.${ext}`;
              const dir = join(process.cwd(), "public", "gen");
              await mkdir(dir, { recursive: true });
              await writeFile(join(dir, filename), buf);
              resolve(NextResponse.json({ ok: true, imageUrl: `/gen/${filename}`, message: "Slika generirana" }));
              return;
            }
          } catch {
            // fallback to original URL if download fails
          }
          resolve(NextResponse.json({ ok: true, imageUrl: result.url, message: "Slika generirana" }));
        } else {
          resolve(NextResponse.json({ error: result.error || "Image gen failed" }, { status: 500 }));
        }
      } catch (e) {
        resolve(NextResponse.json({ error: "Parse error: " + out.slice(0, 200) }, { status: 500 }));
      }
    });

    proc.on("error", (e: Error) => {
      cleanup();
      if (resolved) return;
      resolved = true;
      resolve(NextResponse.json({ error: e.message }, { status: 500 }));
    });

    // 60s timeout — kill process if it exceeds limit
    setTimeout(() => {
      if (resolved) return;
      resolved = true;
      proc.kill('SIGKILL');
      cleanup();
      resolve(NextResponse.json({ error: "Timeout" }, { status: 504 }));
    }, 60000);
    });
  });
}
