import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import { readdirSync, existsSync, mkdirSync, copyFileSync, unlinkSync, readFileSync, writeFileSync, rmSync } from "fs";
import { spawn } from "child_process";
import path from "path";
import { bumpContentVersion } from "@/lib/content";

const DB_PATH = "/opt/openclaw/futurepulse/db/futurepulse.db";
const STALE_REVIEW_DAYS = 7;
// Legacy dirs — kept for backward-compat resolution only (no new files written here)
const FP_IMAGES_LEGACY = "/opt/openclaw/futurepulse/images";
const PUBLIC_ARTICLES_DIR = "/opt/openclaw/workspace/tech-pulse-css/public/images/articles";

// All dirs to search for a file by basename (legacy fallback)
const ALL_IMAGE_DIRS = [FP_IMAGES_LEGACY];

function getDb(readonly = false) {
  // timeout: 10000ms handles concurrent access (pipeline cron may be reading/writing)
  // fileMustExist: true prevents accidental DB creation in wrong location
  return new Database(DB_PATH, { readonly, timeout: 10000, fileMustExist: true });
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
  attribution?: string;
  sourceUrl?: string;
  provider?: string;
  description?: string;
}

interface MemoryMatch {
  id: number;
  title: string;
  status: string | null;
  created_at: string | null;
  score: number;
  reason: string;
  panelUrl: string;
}

function parseMemoryAlert(row: Record<string, unknown>) {
  const memoryStatus = typeof row.memory_status === "string" ? row.memory_status : null;
  if (!memoryStatus || memoryStatus === "clean") return null;

  let matches: MemoryMatch[] = [];
  try {
    const raw = JSON.parse(String(row.memory_matches_json || "[]")) as Array<Record<string, unknown>>;
    matches = raw
      .filter((m) => typeof m.id === "number" && typeof m.title === "string")
      .map((m) => ({
        id: Number(m.id),
        title: String(m.title),
        status: m.status ? String(m.status) : null,
        created_at: m.created_at ? String(m.created_at) : null,
        score: Number(m.score || 0),
        reason: String(m.reason || ""),
        panelUrl: `/foto-review?id=${Number(m.id)}`,
      }));
  } catch {}

  return {
    status: memoryStatus,
    topicKey: typeof row.memory_topic_key === "string" ? row.memory_topic_key : "",
    reason: typeof row.memory_decision_reason === "string" ? row.memory_decision_reason : "",
    checkedAt: typeof row.memory_checked_at === "string" ? row.memory_checked_at : null,
    duplicateOf: typeof row.memory_duplicate_of === "number" ? row.memory_duplicate_of : null,
    matches,
    bestMatch: matches[0] || null,
  };
}

// Build a filename→attribution map from images_json
function buildAttributionMap(imagesJsonRaw: string | null): Map<string, { attribution: string; sourceUrl: string; provider: string; description: string }> {
  const map = new Map<string, { attribution: string; sourceUrl: string; provider: string; description: string }>();
  if (!imagesJsonRaw) return map;
  try {
    const imgs = JSON.parse(imagesJsonRaw);
    for (const slotKey of ["image_main", "image_subtitle"]) {
      const slot = imgs[slotKey];
      if (!slot || typeof slot !== "object") continue;
      const url = slot.url as string | undefined;
      if (!url) continue;
      const filename = path.basename(url);
      const attribution = (slot.attribution || slot.credit_line || slot.attribution_text || "") as string;
      const sourceUrl = (slot.source_page_url || "") as string;
      const provider = (slot.provider || "") as string;
      const description = (slot.selected_reason || slot.alt_text || slot.caption || "") as string;
      if (filename) {
        map.set(filename, { attribution, sourceUrl, provider, description });
      }
    }
  } catch {}
  return map;
}

function getArticleImages(
  article: Record<string, unknown>
): { images: ArticleImage[]; folderName: string | null } {
  const images: ArticleImage[] = [];
  const seenOsPaths = new Set<string>();
  const articleId = article.id as number;
  const attrMap = buildAttributionMap(article.images_json as string | null);

  const addImage = (id: string, url: string, label: string, osPath: string) => {
    if (seenOsPaths.has(osPath)) return;
    seenOsPaths.add(osPath);
    if (!existsSync(osPath)) return;
    const filename = path.basename(osPath);
    const attrInfo = attrMap.get(filename);
    images.push({
      id, url, label, osPath,
      attribution: attrInfo?.attribution || undefined,
      sourceUrl: attrInfo?.sourceUrl || undefined,
      provider: attrInfo?.provider || undefined,
      description: attrInfo?.description || undefined,
    });
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
        // Serve via API route so newly-added files are visible before next rebuild
        const apiUrl = `/api/foto-review/img?folder=${encodeURIComponent(folderName)}&file=${encodeURIComponent(file)}`;
        addImage(`pub:${folderName}/${file}`, apiUrl, label, osPath);
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

// Surgically remove subtitleImage block from MDX frontmatter without rewriting the whole file.
// Safe even if frontmatter contains multi-line part1_en/part2_en fields.
function removeSubtitleImageFromMdx(articleId: number): void {
  const mdxInfo = findArticleMdxInfo(articleId);
  if (!mdxInfo?.mdxPath) return;
  const files = [mdxInfo.mdxPath];
  const hrPath = path.join(path.dirname(mdxInfo.mdxPath), "index.hr.mdx");
  if (existsSync(hrPath)) files.push(hrPath);
  for (const filePath of files) {
    try {
      let content = readFileSync(filePath, "utf8");
      // Remove subtitleImage block: "subtitleImage:\n  url: ...\n  alt: ...\n" (with optional extra fields)
      content = content.replace(/^subtitleImage:\n(?:  [^\n]*\n)*/m, "");
      writeFileSync(filePath, content, "utf8");
    } catch {}
  }
}

// Find MDX file for an article by db_id and update image frontmatter
// Uses findArticleMdxInfo for accurate lookup instead of scanning all files.
function updateMdxImages(articleId: number, mainUrl: string, subtitleUrl: string | null): boolean {
  // Fast path: use findArticleMdxInfo which already found the file
  const mdxInfo = findArticleMdxInfo(articleId);
  const mdxPath = mdxInfo?.mdxPath;

  const updateFile = (filePath: string, requireDbId = true): boolean => {
    if (!existsSync(filePath)) return false;
    let content = readFileSync(filePath, "utf8");
    if (requireDbId && !content.includes(`db_id: ${articleId}`)) return false;

    const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?/);
    if (!fmMatch) return false;
    let frontmatter = fmMatch[1];
    const body = content.slice(fmMatch[0].length);

    // Update image.url — handles both YAML block styles:
    //   image:\n  url: "..."
    if (/^image:\n\s+url:\s*/m.test(frontmatter)) {
      frontmatter = frontmatter.replace(
        /^(image:\n\s+url:\s*)"[^"]*"/m,
        `$1"${mainUrl}"`
      );
    } else {
      frontmatter += `\nimage:\n  url: "${mainUrl}"\n  alt: ""`;
    }

    // Update or insert subtitleImage block so already-published articles
    // without this block can start showing the subtitle image immediately.
    if (subtitleUrl) {
      if (/^subtitleImage:\n\s+url:\s*/m.test(frontmatter)) {
        frontmatter = frontmatter.replace(
          /^(subtitleImage:\n\s+url:\s*)"[^"]*"/m,
          `$1"${subtitleUrl}"`
        );
      } else {
        const insertAfterSubtitleEn = /^subtitle_en:.*$/m;
        const insertAfterSubtitle = /^subtitle:.*$/m;
        const block = `\nsubtitleImage:\n  url: "${subtitleUrl}"\n  alt: ""`;
        if (insertAfterSubtitleEn.test(frontmatter)) {
          frontmatter = frontmatter.replace(insertAfterSubtitleEn, (m) => `${m}${block}`);
        } else if (insertAfterSubtitle.test(frontmatter)) {
          frontmatter = frontmatter.replace(insertAfterSubtitle, (m) => `${m}${block}`);
        } else {
          frontmatter += block;
        }
      }
    }

    content = `---\n${frontmatter}\n---\n${body}`;
    writeFileSync(filePath, content, "utf8");
    return true;
  };

  try {
    if (mdxPath && updateFile(mdxPath, true)) {
      // Keep HR file in sync with EN frontmatter image paths.
      const hrPath = path.join(path.dirname(mdxPath), "index.hr.mdx");
      if (existsSync(hrPath)) updateFile(hrPath, false);
      return true;
    }

    // Fallback: scan all content dirs (slower but safe)
    const CONTENT_DIR = path.join(process.cwd(), "content");
    const cats = readdirSync(CONTENT_DIR);
    for (const cat of cats) {
      const catDir = path.join(CONTENT_DIR, cat);
      let entries: string[];
      try { entries = readdirSync(catDir); } catch { continue; }
      for (const entry of entries) {
        const enPath = path.join(catDir, entry, "index.mdx");
        if (updateFile(enPath, true)) {
          const hrPath = path.join(catDir, entry, "index.hr.mdx");
          if (existsSync(hrPath)) updateFile(hrPath, false);
          return true;
        }
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
    source_url: row.source_url || null,
    memoryAlert: parseMemoryAlert(row),
    images,
    folderName,
  };
}

function deleteArticleAssetsAndRecord(db: Database.Database, articleId: number): boolean {
  const article = db
    .prepare("SELECT id, title FROM articles WHERE id = ?")
    .get(articleId) as Record<string, unknown> | undefined;
  if (!article) return false;

  const mdxInfo = findArticleMdxInfo(articleId);
  const deletedFolders = new Set<string>();

  try {
    const cats = readdirSync(CONTENT_DIR_ROOT);
    for (const cat of cats) {
      const catDir = path.join(CONTENT_DIR_ROOT, cat);
      let entries: string[];
      try { entries = readdirSync(catDir); } catch { continue; }

      for (const entry of entries) {
        const entryPath = path.join(catDir, entry);
        try { readdirSync(entryPath); } catch { continue; }

        for (const mdxFile of ["index.mdx", "index.en.mdx", "index.hr.mdx"]) {
          const mdxPath = path.join(entryPath, mdxFile);
          if (!existsSync(mdxPath)) continue;

          const head = readFileSync(mdxPath, "utf8").slice(0, 2000);
          if (!head.includes(`db_id: ${articleId}`)) continue;
          deletedFolders.add(entryPath);
        }
      }
    }
  } catch (e) {
    console.error(`Error scanning for article ${articleId} MDX files: ${e}`);
  }

  for (const folder of deletedFolders) {
    try {
      rmSync(folder, { recursive: true, force: true });
    } catch (e) {
      console.error(`Failed to delete MDX folder ${folder}: ${e}`);
    }
  }

  if (mdxInfo?.imageFolder) {
    try {
      rmSync(path.join(PUBLIC_ARTICLES_DIR, mdxInfo.imageFolder), { recursive: true, force: true });
    } catch (e) {
      console.error(`Failed to delete image folder for article ${articleId}: ${e}`);
    }
  }

  try {
    if (existsSync(FP_IMAGES_LEGACY)) {
      const legacyPrefix = `art${articleId}_`;
      for (const file of readdirSync(FP_IMAGES_LEGACY)) {
        if (!file.startsWith(legacyPrefix)) continue;
        try {
          unlinkSync(path.join(FP_IMAGES_LEGACY, file));
        } catch (e) {
          console.error(`Failed to delete legacy image ${file} for article ${articleId}: ${e}`);
        }
      }
    }
  } catch (e) {
    console.error(`Failed to scan legacy images for article ${articleId}: ${e}`);
  }

  db.prepare("DELETE FROM article_image_candidates WHERE article_id = ?").run(articleId);
  db.prepare("DELETE FROM articles WHERE id = ?").run(articleId);
  return true;
}

function cleanupStaleUnpublishedArticles(db: Database.Database): number {
  const staleRows = db
    .prepare(
      `SELECT id
       FROM articles
       WHERE status != 'published'
         AND COALESCE(github_uploaded, 0) = 0
         AND datetime(created_at) < datetime('now', ?)
       ORDER BY datetime(created_at) ASC`
    )
    .all(`-${STALE_REVIEW_DAYS} days`) as Array<{ id: number }>;

  let deleted = 0;
  for (const row of staleRows) {
    if (deleteArticleAssetsAndRecord(db, row.id)) deleted += 1;
  }
  return deleted;
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
  const filter = url.searchParams.get("filter") || "approved";

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
    const purgeDb = getDb();
    let purgedCount = 0;
    try {
      purgedCount = cleanupStaleUnpublishedArticles(purgeDb);
    } finally {
      purgeDb.close();
    }

    if (singleId) {
      const row = db
        .prepare(
          `SELECT id, title, title_en, category, lead, pipeline_stage, status,
                  images_json, github_uploaded, created_at, source_url,
                  memory_status, memory_topic_key, memory_duplicate_of,
                  memory_matches_json, memory_decision_reason, memory_checked_at
           FROM articles WHERE id = ?`
        )
        .get(Number(singleId)) as Record<string, unknown> | undefined;
      db.close();
      if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ article: rowToArticle(row), purgedCount });
    }

    // Build query based on filter parameter
    let whereClause = "";
    let timeParam = `${-STALE_REVIEW_DAYS} days`;

    if (filter === "published") {
      whereClause = `WHERE status = 'published' ORDER BY datetime(created_at) DESC, id DESC LIMIT 100`;
    } else if (filter === "approved") {
      whereClause = `WHERE status = 'approved' AND COALESCE(github_uploaded, 0) = 0 AND datetime(created_at) >= datetime('now', ?) ORDER BY datetime(created_at) DESC, id DESC`;
    } else if (filter === "pending") {
      whereClause = `WHERE status NOT IN ('rejected', 'published') ORDER BY datetime(created_at) DESC, id DESC LIMIT 100`;
    } else if (filter === "all") {
      whereClause = `WHERE status NOT IN ('rejected') ORDER BY datetime(created_at) DESC, id DESC LIMIT 100`;
    }

    let rows: Record<string, unknown>[];
    if (whereClause.includes("?")) {
      rows = db
        .prepare(
          `SELECT id, title, title_en, category, lead, pipeline_stage, status,
                  images_json, github_uploaded, created_at, source_url,
                  memory_status, memory_topic_key, memory_duplicate_of,
                  memory_matches_json, memory_decision_reason, memory_checked_at
           FROM articles
           ${whereClause}`
        )
        .all(timeParam) as Record<string, unknown>[];
    } else {
      rows = db
        .prepare(
          `SELECT id, title, title_en, category, lead, pipeline_stage, status,
                  images_json, github_uploaded, created_at, source_url,
                  memory_status, memory_topic_key, memory_duplicate_of,
                  memory_matches_json, memory_decision_reason, memory_checked_at
           FROM articles
           ${whereClause}`
        )
        .all() as Record<string, unknown>[];
    }
    db.close();

    return NextResponse.json({
      articles: rows.map(rowToArticle),
      total: rows.length,
      purgedCount,
      freshnessDays: STALE_REVIEW_DAYS,
    });
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
        `SELECT id, title, title_en, category, images_json, github_uploaded, status FROM articles WHERE id = ?`
      )
      .get(articleId) as Record<string, unknown> | undefined;

    if (!article) {
      db.close();
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // ── delete_article ──────────────────────────────────────────────────────────
    if (action === "delete_article") {
      const article = db.prepare("SELECT id, title FROM articles WHERE id = ?").get(articleId);
      if (!article) {
        db.close();
        return NextResponse.json({ error: "Članak ne postoji", ok: false }, { status: 404 });
      }
      deleteArticleAssetsAndRecord(db, articleId);
      db.close();
      bumpContentVersion();

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
          let subtitleRemoved = false;
          if (imgs.image_main?.url?.includes(basename)) {
            delete imgs.image_main;
            changed = true;
          }
          if (imgs.image_subtitle?.url?.includes(basename)) {
            delete imgs.image_subtitle;
            changed = true;
            subtitleRemoved = true;
          }
          if (changed) {
            db.prepare("UPDATE articles SET images_json = ? WHERE id = ?").run(
              JSON.stringify(imgs),
              articleId
            );
            // If subtitle was removed, surgically remove subtitleImage block from MDX
            if (subtitleRemoved) {
              removeSubtitleImageFromMdx(articleId);
            }
          }
        } catch {}
      }

      db.close();
      bumpContentVersion();
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

      // Clean up old generated/pulled images (art{id}_*) to avoid clutter
      // Keep only active main/subtitle files
      try {
        const allFiles = readdirSync(targetDir);
        const artPrefix = `art${articleId}_`;
        for (const file of allFiles) {
          if (file.startsWith(artPrefix)) {
            // This is an old generated/pulled image — safe to delete
            try {
              unlinkSync(path.join(targetDir, file));
            } catch {}
          }
        }
      } catch {}

      // Preserve existing prompts when updating images_json (for style reference)
      let existingData: Record<string, unknown> = {};
      let existingMain: Record<string, unknown> = {};
      let existingSub: Record<string, unknown> = {};
      try {
        const existing = JSON.parse((article.images_json as string) || "{}");
        existingData = existing;
        existingMain = existing.image_main || {};
        existingSub = existing.image_subtitle || {};
      } catch {}

      const mainPublicUrl = `/images/articles/${folderName}/main${heroExt}`;
      const subPublicUrl = targetSubtitle
        ? `/images/articles/${folderName}/subtitle${path.extname(targetSubtitle).toLowerCase() || ".jpg"}`
        : null;

      // Update images_json in DB — preserve ALL existing data except image_main/image_subtitle URLs
      const newImgsJson: Record<string, unknown> = {
        ...existingData,  // Keep all existing data (history, metadata, etc)
        image_main: { ...existingMain, url: mainPublicUrl },
        success: true,
        user_selected: true,  // Mark that user explicitly selected these images (prevent auto-overwrite)
        user_selected_at: Date.now(),
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
      const mdxUpdated = updateMdxImages(articleId, mainPublicUrl, subPublicUrl);
      if (!mdxUpdated) {
        console.warn(`[foto-review] WARNING: MDX update failed for article ${articleId}, images may not be visible in published MDX`);
      }
      bumpContentVersion();

      return NextResponse.json({
        ok: true,
        mdxUpdated,  // Include in response so client knows if MDX was actually updated
        message: `✓ Slike snimljene u ${folderName} — ${mdxUpdated ? 'vidljive odmah bez rebuilda' : 'DB update OK, ali MDX nije ažuriran'}`,
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

    // ── regen_lead ───────────────────────────────────────────────────────────────
    if (action === "regen_lead") {
      const { spawn } = await import("child_process");
      const PYTHON = "/opt/openclaw/futurepulse/venv/bin/python3";
      const FP_DIR = "/opt/openclaw/futurepulse";
      const script = `
import sys, asyncio, sqlite3
sys.path.insert(0, '.')
import logging
logging.basicConfig(filename='logs/foto_review.log', level=logging.INFO)

async def run():
    conn = sqlite3.connect('db/futurepulse.db', timeout=10)
    conn.row_factory = sqlite3.Row
    row = conn.execute('SELECT * FROM articles WHERE id=?', (${articleId},)).fetchone()
    conn.close()
    if not row:
        print('Article not found')
        return
    from core.api_pool import get_api_pool
    pool = get_api_pool()
    title_en = row['title_en'] or row['title'] or ''
    part1_en = row['part1_en'] or row['part1'] or ''
    part1_hr = row['part1'] or ''
    category = row['category'] or 'tech'
    prompt_en = f"""You are a lead sentence writer. Write ONE precise English sentence (max 130 chars) for this article.
It must add a specific fact, number, or name NOT in the headline. Start with the subject or a fact — NEVER start with When/While/After/As/Following.
Headline: {title_en}
First paragraph: {part1_en[:400]}
Return ONLY the sentence, nothing else."""
    prompt_hr = f"""Napiši JEDNU preciznu rečenicu na hrvatskom (max 130 znakova) za ovaj članak.
Mora dodati specifičan podatak, broj ili ime koji NIJE u naslovu. Počni subjektom ili činjenicom — NIKAD ne počinji s Kad/Kada/Dok/Nakon/Prema.
Naslov: {row['title'] or title_en}
Uvod: {part1_hr[:400]}
Vrati SAMO rečenicu, ništa drugo."""
    lead_en = ''
    lead_hr = ''
    result_en = await pool.call_model_with_fallback(
        prompt=prompt_en,
        models=['mistral-large', 'nv-llama', 'nv-mistral'],
        max_tokens=100,
        temperature=0.5,
    )
    lead_en = (result_en.get('content') or '').strip().strip('"').strip("'")
    result_hr = await pool.call_model_with_fallback(
        prompt=prompt_hr,
        models=['mistral-large', 'nv-llama', 'nv-mistral'],
        max_tokens=100,
        temperature=0.5,
    )
    lead_hr = (result_hr.get('content') or '').strip().strip('"').strip("'")
    conn2 = sqlite3.connect('db/futurepulse.db', timeout=10)
    if lead_en:
        conn2.execute('UPDATE articles SET lead_sentence_en=? WHERE id=?', (lead_en, ${articleId}))
    if lead_hr:
        conn2.execute('UPDATE articles SET lead_sentence=? WHERE id=?', (lead_hr, ${articleId}))
    conn2.commit()
    conn2.close()
    print(f'lead_hr={lead_hr[:60]!r}')
    print(f'lead_en={lead_en[:60]!r}')

asyncio.run(run())
`;
      db.close();
      const proc = spawn(PYTHON, ["-c", script], { cwd: FP_DIR, detached: true, stdio: "ignore" });
      proc.unref();
      return NextResponse.json({ ok: true, message: "Regeneracija leada pokrenuta (~15s)" });
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
