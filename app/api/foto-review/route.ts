import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import { readdirSync, existsSync, mkdirSync, copyFileSync, unlinkSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const DB_PATH = "/opt/openclaw/futurepulse/db/futurepulse.db";
// Legacy dirs — kept for backward-compat resolution only (no new files written here)
const FP_IMAGES_LEGACY = "/opt/openclaw/futurepulse/images";
const PUBLIC_ARTICLES_DIR = "/opt/openclaw/workspace/tech-pulse-css/public/images/articles";

// All dirs to search for a file by basename (legacy fallback)
const ALL_IMAGE_DIRS = [FP_IMAGES_LEGACY];

function getDb(readonly = false) {
  return new Database(DB_PATH, { readonly });
}

// Mirror of github_uploader._slugify
function slugify(text: string, maxLen = 50): string {
  const charMap: Record<string, string> = {
    "č": "c", "ć": "c", "š": "s", "ž": "z", "đ": "dj",
    "Č": "c", "Ć": "c", "Š": "s", "Ž": "z", "Đ": "dj",
  };
  let t = text.toLowerCase();
  for (const [src, dst] of Object.entries(charMap)) {
    t = t.split(src).join(dst);
  }
  t = t.normalize("NFKD").replace(/[^\x00-\x7F]/g, "");
  t = t.replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return t.slice(0, maxLen);
}

const CONTENT_DIR_ROOT = "/opt/openclaw/workspace/tech-pulse-css/content";

/**
 * Find an article's MDX file (by db_id) and return:
 *   mdxPath: absolute path to index.mdx
 *   imageSlug: the slug used for the image folder in public/images/articles/
 *              This is the LAST part of the MDX folder name (after the date prefix).
 *   imageFolder: the folder name in public/images/articles/ (may have date prefix or not)
 */
function findArticleMdxInfo(articleId: number): {
  mdxPath: string;
  imageSlug: string;
  imageFolder: string;
} | null {
  if (!articleId || !existsSync(CONTENT_DIR_ROOT)) return null;
  try {
    const cats = readdirSync(CONTENT_DIR_ROOT);
    for (const cat of cats) {
      const catDir = path.join(CONTENT_DIR_ROOT, cat);
      let entries: string[];
      try { entries = readdirSync(catDir); } catch { continue; }
      for (const entry of entries) {
        const mdxPath = path.join(catDir, entry, "index.mdx");
        if (!existsSync(mdxPath)) continue;
        // Quick check without reading full file: look for db_id in first 2KB
        const head = readFileSync(mdxPath, "utf8").slice(0, 2000);
        if (!head.includes(`db_id: ${articleId}`)) continue;

        // entry is like "2026-03-07-some-slug" or "some-slug"
        // Image folder in public/images/articles/ uses the SLUG without date prefix
        // because github_uploader uses: img_path = f"public/images/articles/{slug}/main.{ext}"
        // where slug = _slugify(title_en) — no date prefix!
        const dateMatch = entry.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
        const imageSlug = dateMatch ? dateMatch[2] : entry;

        // Find actual existing image folder: first try without date prefix, then with
        if (!existsSync(PUBLIC_ARTICLES_DIR)) return { mdxPath, imageSlug, imageFolder: imageSlug };
        const folders = readdirSync(PUBLIC_ARTICLES_DIR);
        // Prefer exact slug match (no date prefix) — that's what github_uploader creates
        const exactMatch = folders.find(f => f === imageSlug);
        if (exactMatch) return { mdxPath, imageSlug, imageFolder: exactMatch };
        // Fallback: full entry name (date-slug) as image folder
        const fullMatch = folders.find(f => f === entry);
        if (fullMatch) return { mdxPath, imageSlug, imageFolder: fullMatch };
        // Fallback: any folder ending with the imageSlug
        const partialMatch = folders.find(f => f.endsWith("-" + imageSlug) || f === imageSlug);
        if (partialMatch) return { mdxPath, imageSlug, imageFolder: partialMatch };

        // No existing image folder yet — will be created at imageSlug (matching github_uploader convention)
        return { mdxPath, imageSlug, imageFolder: imageSlug };
      }
    }
  } catch {}
  return null;
}

// Find the article's image folder in public/images/articles/ (by title slug only, no db_id lookup)
function findArticleFolder(titleEn: string | null): string | null {
  if (!titleEn || !existsSync(PUBLIC_ARTICLES_DIR)) return null;
  const slug = slugify(titleEn);
  const folders = readdirSync(PUBLIC_ARTICLES_DIR);
  // Priority: exact slug match (no date) → then with date prefix
  return folders.find(f => f === slug) ??
    folders.find(f => f.endsWith("-" + slug)) ??
    null;
}

// Extract a plain URL string from an images_json value (string or {url:...} object)
function extractUrl(val: unknown): string | null {
  if (typeof val === "string" && val.length > 0) return val;
  if (val && typeof val === "object" && "url" in val && typeof (val as Record<string,unknown>).url === "string")
    return (val as Record<string,unknown>).url as string;
  return null;
}

// Resolve any URL/path from images_json → { osPath, displayUrl } or null
function resolveImageUrl(url: string): { osPath: string; displayUrl: string } | null {
  if (!url) return null;

  // Already a public/images/articles/ path — served statically
  if (url.includes("/images/articles/")) {
    const rel = url.replace(/^\/images\/articles\//, "");
    const osPath = path.join(PUBLIC_ARTICLES_DIR, rel);
    return { osPath, displayUrl: url };
  }

  const basename = path.basename(url);

  // Absolute OS path (e.g. /root/.openclaw/... or /opt/...) — try direct first, then by basename
  if (url.startsWith("/root/") || url.startsWith("/opt/")) {
    if (existsSync(url)) {
      return { osPath: url, displayUrl: `/api/foto-review/img?file=${encodeURIComponent(basename)}` };
    }
    // Fall through to basename search below
  }

  // Search by basename across all known image directories
  const found = ALL_IMAGE_DIRS.map(d => path.join(d, basename)).find(p => existsSync(p));
  if (found) {
    return { osPath: found, displayUrl: `/api/foto-review/img?file=${encodeURIComponent(basename)}` };
  }

  return null;
}

interface ArticleImage {
  id: string;
  url: string;
  label: string;
  osPath: string;
}

function getArticleImages(
  article: Record<string, unknown>
): { images: ArticleImage[]; folderName: string | null } {
  const images: ArticleImage[] = [];
  const seenOsPaths = new Set<string>();
  const articleId = article.id as number;

  const addImage = (id: string, url: string, label: string, osPath: string) => {
    if (seenOsPaths.has(osPath)) return;
    seenOsPaths.add(osPath);
    if (!existsSync(osPath)) return;
    images.push({ id, url, label, osPath });
  };

  // Single scan of the article's public folder — shows active + generated history
  const mdxInfo = findArticleMdxInfo(articleId);
  const folderName = mdxInfo?.imageFolder ?? findArticleFolder(article.title_en as string | null);
  const prefix = `art${articleId}_`;

  if (folderName) {
    const folderPath = path.join(PUBLIC_ARTICLES_DIR, folderName);
    try {
      const files = readdirSync(folderPath).sort();
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) continue;
        const osPath = path.join(folderPath, file);
        const lf = file.toLowerCase();
        let label: string;
        if (lf.startsWith("main")) {
          label = "✓ Main (aktivan)";
        } else if (lf.startsWith("subtitle")) {
          label = "✓ Subtitle (aktivan)";
        } else if (file.startsWith(prefix)) {
          if (lf.includes("_main_")) label = `Gen Main — ${file}`;
          else if (lf.includes("_sub_")) label = `Gen Sub — ${file}`;
          else label = `Gen — ${file}`;
        } else {
          continue; // skip unrecognized files
        }
        addImage(`pub:${folderName}/${file}`, `/images/articles/${folderName}/${file}`, label, osPath);
      }
    } catch {}
  }

  // Also check legacy dir for any art{id}_ files not yet migrated
  if (articleId) {
    try {
      const legacyFiles = readdirSync(FP_IMAGES_LEGACY).sort();
      for (const file of legacyFiles) {
        if (!file.startsWith(prefix)) continue;
        const ext = path.extname(file).toLowerCase();
        if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) continue;
        const osPath = path.join(FP_IMAGES_LEGACY, file);
        const lf = file.toLowerCase();
        let label = `Gen (legacy) — ${file}`;
        if (lf.includes("_main_")) label = `Gen Main (legacy) — ${file}`;
        else if (lf.includes("_sub_")) label = `Gen Sub (legacy) — ${file}`;
        addImage(`gen:${file}`, `/api/foto-review/img?file=${encodeURIComponent(file)}`, label, osPath);
      }
    } catch {}
  }

  return { images, folderName: folderName ?? null };
}

// Find MDX file for an article by db_id and update image frontmatter
// Uses findArticleMdxInfo for accurate lookup instead of scanning all files.
function updateMdxImages(articleId: number, mainUrl: string, subtitleUrl: string | null): boolean {
  // Fast path: use findArticleMdxInfo which already found the file
  const mdxInfo = findArticleMdxInfo(articleId);
  const mdxPath = mdxInfo?.mdxPath;

  const updateFile = (filePath: string): boolean => {
    if (!existsSync(filePath)) return false;
    let content = readFileSync(filePath, "utf8");
    if (!content.includes(`db_id: ${articleId}`)) return false;

    // Update image.url — handles both YAML block styles:
    //   image:\n  url: "..."
    content = content.replace(
      /^(image:\n\s+url:\s*)"[^"]*"/m,
      `$1"${mainUrl}"`
    );
    // Update subtitleImage.url if present
    if (subtitleUrl && /^subtitleImage:/m.test(content)) {
      content = content.replace(
        /^(subtitleImage:\n\s+url:\s*)"[^"]*"/m,
        `$1"${subtitleUrl}"`
      );
    }
    writeFileSync(filePath, content, "utf8");
    return true;
  };

  try {
    if (mdxPath && updateFile(mdxPath)) return true;

    // Fallback: scan all content dirs (slower but safe)
    const CONTENT_DIR = path.join(process.cwd(), "content");
    const cats = readdirSync(CONTENT_DIR);
    for (const cat of cats) {
      const catDir = path.join(CONTENT_DIR, cat);
      let entries: string[];
      try { entries = readdirSync(catDir); } catch { continue; }
      for (const entry of entries) {
        const fp = path.join(catDir, entry, "index.mdx");
        if (updateFile(fp)) return true;
      }
    }
  } catch (e) {
    console.error("updateMdxImages error:", e);
  }
  return false;
}

function rowToArticle(row: Record<string, unknown>) {
  const { images, folderName } = getArticleImages(row);
  return {
    id: row.id,
    title: row.title,
    title_en: row.title_en,
    category: row.category,
    lead: row.lead ? (row.lead as string).slice(0, 220) : "",
    pipeline_stage: row.pipeline_stage,
    status: row.status,
    github_uploaded: row.github_uploaded,
    created_at: row.created_at,
    images,
    folderName,
  };
}

// ─── GET /api/foto-review ──────────────────────────────────────────────────────
// ?id=123  → single article refresh
// (no id)  → full list
export async function GET(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_AGENT_PANEL !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const singleId = url.searchParams.get("id");
  const showLog = url.searchParams.get("log");
  const showQueue = url.searchParams.get("queue");

  // Return queue status
  if (showQueue) {
    try {
      const db = getDb(true);
      db.exec(`CREATE TABLE IF NOT EXISTS task_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT, article_id INTEGER NOT NULL,
        task_type TEXT NOT NULL, model TEXT DEFAULT 'auto',
        status TEXT DEFAULT 'pending', error_msg TEXT,
        created_at TEXT DEFAULT (datetime('now')), done_at TEXT)`);
      const tasks = db.prepare(
        "SELECT id, article_id, task_type, model, status, error_msg, created_at, done_at FROM task_queue ORDER BY id DESC LIMIT 80"
      ).all();
      const counts = db.prepare(
        "SELECT status, COUNT(*) as n FROM task_queue GROUP BY status"
      ).all();
      db.close();
      return NextResponse.json({ tasks, counts });
    } catch (e: unknown) {
      return NextResponse.json({ tasks: [], counts: [], error: (e as Error).message });
    }
  }

  // Return last N lines of image_regen.log
  if (showLog) {
    try {
      const { readFileSync } = await import("fs");
      const logPath = "/opt/openclaw/futurepulse/logs/image_regen.log";
      const lines = readFileSync(logPath, "utf8").split("\n").filter(Boolean);
      const n = Math.min(parseInt(showLog, 10) || 40, 200);
      return NextResponse.json({ lines: lines.slice(-n) });
    } catch {
      return NextResponse.json({ lines: [] });
    }
  }

  try {
    const db = getDb(true);

    if (singleId) {
      const row = db
        .prepare(
          `SELECT id, title, title_en, category, lead, pipeline_stage, status,
                  images_json, github_uploaded, created_at
           FROM articles WHERE id = ?`
        )
        .get(Number(singleId)) as Record<string, unknown> | undefined;
      db.close();
      if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ article: rowToArticle(row) });
    }

    const rows = db
      .prepare(
        `SELECT id, title, title_en, category, lead, pipeline_stage, status,
                images_json, github_uploaded, created_at
         FROM articles
         ORDER BY id ASC`
      )
      .all() as Record<string, unknown>[];
    db.close();

    return NextResponse.json({ articles: rows.map(rowToArticle), total: rows.length });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── POST /api/foto-review ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_AGENT_PANEL !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, articleId } = body;

    if (!articleId) {
      return NextResponse.json({ error: "Missing articleId" }, { status: 400 });
    }

    const db = getDb();
    const article = db
      .prepare(
        `SELECT id, title, title_en, category, images_json FROM articles WHERE id = ?`
      )
      .get(articleId) as Record<string, unknown> | undefined;

    if (!article) {
      db.close();
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // ── delete_article ──────────────────────────────────────────────────────────
    if (action === "delete_article") {
      // Hard delete: MDX + images + DB entry
      // Handles EN/HR bilingual deletion — deletes all MDX files with same db_id
      const article = db.prepare("SELECT id, title FROM articles WHERE id = ?").get(articleId);
      if (!article) {
        db.close();
        return NextResponse.json({ error: "Članak ne postoji", ok: false }, { status: 404 });
      }

      // 1. Find and delete ALL MDX files with this db_id (EN + HR versions)
      const fs = require("fs");
      const deletedFolders = new Set<string>();

      try {
        const cats = readdirSync(CONTENT_DIR_ROOT);
        for (const cat of cats) {
          const catDir = path.join(CONTENT_DIR_ROOT, cat);
          let entries: string[];
          try { entries = readdirSync(catDir); } catch { continue; }

          for (const entry of entries) {
            const entryPath = path.join(catDir, entry);
            let entriesInFolder: string[];
            try { entriesInFolder = readdirSync(entryPath); } catch { continue; }

            // Check both index.mdx and index.hr.mdx (and index.en.mdx if present)
            for (const mdxFile of ["index.mdx", "index.en.mdx", "index.hr.mdx"]) {
              const mdxPath = path.join(entryPath, mdxFile);
              if (!existsSync(mdxPath)) continue;

              const head = readFileSync(mdxPath, "utf8").slice(0, 2000);
              if (!head.includes(`db_id: ${articleId}`)) continue;

              // Found a matching file — mark folder for deletion
              deletedFolders.add(entryPath);
            }
          }
        }

        // Delete all matched folders
        for (const folder of deletedFolders) {
          try {
            fs.rmSync(folder, { recursive: true, force: true });
            console.log(`Deleted MDX folder: ${folder}`);
          } catch (e) {
            console.error(`Failed to delete MDX folder ${folder}: ${e}`);
          }
        }
      } catch (e) {
        console.error(`Error scanning for MDX files: ${e}`);
      }

      // 2. Delete image folder
      const mdxInfo = findArticleMdxInfo(articleId);
      if (mdxInfo?.imageFolder) {
        try {
          const imgFolder = path.join(PUBLIC_ARTICLES_DIR, mdxInfo.imageFolder);
          fs.rmSync(imgFolder, { recursive: true, force: true });
          console.log(`Deleted image folder: ${imgFolder}`);
        } catch (e) {
          console.error(`Failed to delete image folder: ${e}`);
        }
      }

      // 3. Delete from DB
      db.prepare("DELETE FROM articles WHERE id = ?").run(articleId);
      db.close();

      return NextResponse.json({
        ok: true,
        message: `✅ Članak "#${articleId}" trajno obrisan (MDX + EN/HR verzije + slike + DB)`
      });
    }

    // ── delete_image ─────────────────────────────────────────────────────────────
    if (action === "delete_image") {
      const { imageId } = body as { imageId: string };
      if (!imageId) {
        db.close();
        return NextResponse.json({ error: "Missing imageId" }, { status: 400 });
      }

      let osPath: string | null = null;
      if (imageId.startsWith("gen:")) {
        const basename = imageId.slice(4);
        osPath = ALL_IMAGE_DIRS.map(d => path.join(d, basename)).find(p => existsSync(p)) ?? null;
      } else if (imageId.startsWith("pub:")) {
        osPath = path.join(PUBLIC_ARTICLES_DIR, imageId.slice(4));
      }

      if (!osPath || !existsSync(osPath)) {
        db.close();
        return NextResponse.json({ error: "Slika nije pronađena" }, { status: 404 });
      }

      try {
        unlinkSync(osPath);
      } catch (e) {
        db.close();
        return NextResponse.json({ error: "Brisanje nije uspjelo" }, { status: 500 });
      }

      // Remove from images_json if referenced
      const raw = article.images_json as string | null;
      if (raw) {
        try {
          const imgs = JSON.parse(raw);
          const basename = path.basename(osPath);
          let changed = false;
          if (imgs.image_main?.url?.includes(basename)) {
            delete imgs.image_main;
            changed = true;
          }
          if (imgs.image_subtitle?.url?.includes(basename)) {
            delete imgs.image_subtitle;
            changed = true;
          }
          if (changed) {
            db.prepare("UPDATE articles SET images_json = ? WHERE id = ?").run(
              JSON.stringify(imgs),
              articleId
            );
          }
        } catch {}
      }

      db.close();
      return NextResponse.json({ ok: true, message: "Slika obrisana" });
    }

    // ── select_images ───────────────────────────────────────────────────────────
    if (action === "select_images") {
      const { heroImageId, subtitleImageId } = body as {
        heroImageId: string;
        subtitleImageId?: string;
      };

      const resolveId = (imageId: string): string | null => {
        if (!imageId) return null;
        if (imageId.startsWith("gen:")) {
          const basename = imageId.slice(4);
          // Search pipeline images dir first, then legacy dirs
          return ALL_IMAGE_DIRS.map(d => path.join(d, basename)).find(p => existsSync(p)) ?? null;
        }
        if (imageId.startsWith("pub:")) {
          return path.join(PUBLIC_ARTICLES_DIR, imageId.slice(4));
        }
        return null;
      };

      const heroPath = resolveId(heroImageId);
      if (!heroPath || !existsSync(heroPath)) {
        db.close();
        return NextResponse.json({ error: "Hero slika nije pronađena" }, { status: 400 });
      }

      const subPath = subtitleImageId ? resolveId(subtitleImageId) : null;

      // Find the correct target folder:
      // 1. Use MDX-based lookup (most accurate — matches github_uploader convention)
      // 2. Fall back to title-slug matching
      // 3. Last resort: create new folder using github_uploader's slug convention (NO date prefix)
      const mdxInfo = findArticleMdxInfo(articleId);
      let folderName: string;
      if (mdxInfo?.imageFolder) {
        folderName = mdxInfo.imageFolder;
      } else {
        // Use same slug as github_uploader: _slugify(title_en) — no date prefix
        const englishSlug = slugify(
          (article.title_en as string) || (article.title as string)
        );
        folderName = findArticleFolder(article.title_en as string | null) ?? englishSlug;
      }
      const targetDir = path.join(PUBLIC_ARTICLES_DIR, folderName);
      mkdirSync(targetDir, { recursive: true });

      // Copy hero → main.{ext}
      const heroExt = path.extname(heroPath).toLowerCase() || ".jpg";
      const targetHero = path.join(targetDir, `main${heroExt}`);
      if (heroPath !== targetHero) copyFileSync(heroPath, targetHero);

      // Copy subtitle → subtitle.{ext}
      let targetSubtitle: string | null = null;
      if (subPath && existsSync(subPath)) {
        const subExt = path.extname(subPath).toLowerCase() || ".jpg";
        targetSubtitle = path.join(targetDir, `subtitle${subExt}`);
        if (subPath !== targetSubtitle) copyFileSync(subPath, targetSubtitle);
      }

      // Preserve existing prompts when updating images_json (for style reference)
      let existingMain: Record<string, unknown> = {};
      let existingSub: Record<string, unknown> = {};
      try {
        const existing = JSON.parse((article.images_json as string) || "{}");
        existingMain = existing.image_main || {};
        existingSub = existing.image_subtitle || {};
      } catch {}

      const mainPublicUrl = `/images/articles/${folderName}/main${heroExt}`;
      const subPublicUrl = targetSubtitle
        ? `/images/articles/${folderName}/subtitle${path.extname(targetSubtitle).toLowerCase() || ".jpg"}`
        : null;

      // Update images_json in DB — preserve prompts for style reference
      const newImgsJson: Record<string, unknown> = {
        image_main: { ...existingMain, url: mainPublicUrl },
        success: true,
      };
      if (subPublicUrl) {
        newImgsJson.image_subtitle = { ...existingSub, url: subPublicUrl };
      } else if (existingSub.url) {
        newImgsJson.image_subtitle = existingSub; // keep existing subtitle
      }
      db.prepare("UPDATE articles SET images_json = ? WHERE id = ?").run(
        JSON.stringify(newImgsJson),
        articleId
      );
      db.close();

      // Update local MDX frontmatter so test site shows images
      updateMdxImages(articleId, mainPublicUrl, subPublicUrl);

      // Trigger site rebuild in background (with lock to prevent parallel builds)
      const { spawn } = await import("child_process");
      const lockPath = "/tmp/nextjs_build.lock";

      // Check if build already running
      if (existsSync(lockPath)) {
        return NextResponse.json({
          ok: true,
          message: `⏳ Build već u tijeku — čekaj ~2min prije nego što pokušaš ponovno`,
          building: true
        });
      }

      // Create lock file
      writeFileSync(lockPath, JSON.stringify({ pid: process.pid, time: new Date().toISOString() }));

      const rebuild = spawn(
        "bash", ["-c", `cd /opt/openclaw/workspace/tech-pulse-css && npm run build > /tmp/foto_rebuild.log 2>&1 && systemctl restart tech-pulse-test; rm -f ${lockPath}`],
        { detached: true, stdio: "ignore" }
      );
      rebuild.unref();

      return NextResponse.json({
        ok: true,
        message: `✓ Slike snimljene u ${folderName} — rebuild pokrenut (~2min)`,
      });
    }

    // ── regen_endings ──────────────────────────────────────────────────────────
    if (action === "regen_endings") {
      const { spawn } = await import("child_process");
      const PYTHON = "/opt/openclaw/futurepulse/venv/bin/python3";
      const FP_DIR = "/opt/openclaw/futurepulse";
      const script = `
import sys, asyncio
sys.path.insert(0, '.')
import logging
logging.basicConfig(filename='logs/foto_review.log', level=logging.INFO)
from agents.hr_lang_agent import HRLangAgent
agent = HRLangAgent()
asyncio.run(agent.rewrite_single(${articleId}))
`;
      db.close();
      const proc = spawn(PYTHON, ["-c", script], { cwd: FP_DIR, detached: true, stdio: "ignore" });
      proc.unref();
      return NextResponse.json({ ok: true, message: "Regeneracija završetaka pokrenuta (~30s)" });
    }

    // ── write_en ────────────────────────────────────────────────────────────────
    if (action === "write_en") {
      const { spawn } = await import("child_process");
      const PYTHON = "/opt/openclaw/futurepulse/venv/bin/python3";
      const FP_DIR = "/opt/openclaw/futurepulse";
      const script = `
import sys, asyncio, sqlite3
sys.path.insert(0, '.')
import logging
logging.basicConfig(filename='logs/foto_review.log', level=logging.INFO)
from agents.writer import ArticleWriter

async def run():
    conn = sqlite3.connect('db/futurepulse.db')
    conn.row_factory = sqlite3.Row
    row = conn.execute('SELECT * FROM articles WHERE id=?', (${articleId},)).fetchone()
    conn.close()
    if not row:
        print('Article not found')
        return
    item = {
        'title': row['title_en'] or row['title'] or '',
        'snippet': (row['part1'] or row['body_md'] or '')[:600],
        'source_name': row['source_name'] or '',
        'category': row['category'] or 'tech',
    }
    writer = ArticleWriter()
    ok = await writer.write_article_en(${articleId}, item, [])
    print('EN write OK' if ok else 'EN write FAILED')

asyncio.run(run())
`;
      db.close();
      const proc = spawn(PYTHON, ["-c", script], { cwd: FP_DIR, detached: true, stdio: "ignore" });
      proc.unref();
      return NextResponse.json({ ok: true, message: "Pisanje EN verzije pokrenuto (~30s)" });
    }

    // ── write_hr ────────────────────────────────────────────────────────────────
    if (action === "write_hr") {
      const { spawn } = await import("child_process");
      const PYTHON = "/opt/openclaw/futurepulse/venv/bin/python3";
      const FP_DIR = "/opt/openclaw/futurepulse";
      const script = `
import sys, asyncio, sqlite3, json
sys.path.insert(0, '.')
import logging
logging.basicConfig(filename='logs/foto_review.log', level=logging.INFO)
from agents.hr_lang_agent import HRLangAgent

async def run():
    conn = sqlite3.connect('db/futurepulse.db')
    conn.row_factory = sqlite3.Row
    row = conn.execute('SELECT * FROM articles WHERE id=?', (${articleId},)).fetchone()
    if not row:
        conn.close()
        print('Article not found')
        return
    body = row['body_md'] or ''
    part1 = row['part1'] or ''
    part2 = row['part2'] or ''
    if not part1 and body:
        paras = [p for p in body.split('\\n\\n') if p.strip()]
        half = max(1, len(paras) // 2)
        part1 = '\\n\\n'.join(paras[:half])
        part2 = '\\n\\n'.join(paras[half:])
    try:
        endings = json.loads(row['endings_json'] or '{}')
    except Exception:
        endings = {}
    article = {
        'id': ${articleId},
        'title': row['title'] or row['title_en'] or '',
        'subtitle': row['subtitle'] or row['subtitle_en'] or '',
        'part1': part1,
        'part2': part2,
        'endings': endings,
        'category': row['category'] or 'tech',
    }
    agent = HRLangAgent()
    article, _ = await agent.run_structure_stage(article)
    article, _ = await agent.run_language_stage(article)
    conn.execute("""
        UPDATE articles SET title=?, subtitle=?, part1=?, part2=?, endings_json=?
        WHERE id=?
    """, (
        article.get('title') or row['title'],
        article.get('subtitle') or row['subtitle'],
        article.get('part1', ''),
        article.get('part2', ''),
        json.dumps(article.get('endings', endings)),
        ${articleId}
    ))
    conn.commit()
    conn.close()
    print(f'HR write OK for #{${articleId}}')

asyncio.run(run())
`;
      db.close();
      const proc = spawn(PYTHON, ["-c", script], { cwd: FP_DIR, detached: true, stdio: "ignore" });
      proc.unref();
      return NextResponse.json({ ok: true, message: "Pisanje HR verzije pokrenuto (~45s)" });
    }

    // ── queue_add ────────────────────────────────────────────────────────────────
    if (action === "queue_add") {
      const { taskType, model: qModel } = body as { taskType: string; model?: string };
      if (!taskType) { db.close(); return NextResponse.json({ error: "Missing taskType" }, { status: 400 }); }
      db.exec(`CREATE TABLE IF NOT EXISTS task_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT, article_id INTEGER NOT NULL,
        task_type TEXT NOT NULL, model TEXT DEFAULT 'auto',
        status TEXT DEFAULT 'pending', error_msg TEXT,
        created_at TEXT DEFAULT (datetime('now')), done_at TEXT)`);
      db.prepare("INSERT INTO task_queue (article_id, task_type, model) VALUES (?, ?, ?)")
        .run(articleId, taskType, qModel || "auto");
      db.close();
      // Spawn queue runner (lockfile prevents duplicates)
      const { spawn } = await import("child_process");
      const proc = spawn(
        "/opt/openclaw/futurepulse/venv/bin/python3",
        ["queue_runner.py"],
        { cwd: "/opt/openclaw/futurepulse", detached: true, stdio: "ignore" }
      );
      proc.unref();
      return NextResponse.json({ ok: true, message: "Dodano u queue" });
    }

    // ── queue_clear ──────────────────────────────────────────────────────────────
    if (action === "queue_clear") {
      db.exec(`CREATE TABLE IF NOT EXISTS task_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT, article_id INTEGER NOT NULL,
        task_type TEXT NOT NULL, model TEXT DEFAULT 'auto',
        status TEXT DEFAULT 'pending', error_msg TEXT,
        created_at TEXT DEFAULT (datetime('now')), done_at TEXT)`);
      const info = db.prepare("DELETE FROM task_queue WHERE status IN ('done', 'error')").run();
      db.close();
      return NextResponse.json({ ok: true, deleted: info.changes });
    }

    db.close();
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
