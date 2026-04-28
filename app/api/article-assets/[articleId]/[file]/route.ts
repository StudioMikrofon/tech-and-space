import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import Database from "better-sqlite3";
import matter from "gray-matter";

const CONTENT_DIR_ROOT = "/opt/openclaw/workspace/tech-pulse-mc/content";
const DB_PATH = "/opt/openclaw/futurepulse/db/futurepulse.db";
const PUBLIC_ARTICLES_DIR = "/opt/openclaw/workspace/tech-pulse-mc/public/images/articles";

function slugify(text: string, maxLen = 72): string {
  const charMap: Record<string, string> = {
    "č": "c", "ć": "c", "š": "s", "ž": "z", "đ": "dj",
    "Č": "c", "Ć": "c", "Š": "s", "Ž": "z", "Đ": "dj",
  };
  let t = text.toLowerCase();
  for (const [src, dst] of Object.entries(charMap)) t = t.split(src).join(dst);
  return t
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLen);
}

function contentCategory(category: unknown) {
  const value = String(category || "tech").toLowerCase().trim();
  if (value === "tech" || value === "energy") return "technology";
  return value || "technology";
}

function getDbArticle(articleId: number): Record<string, unknown> | null {
  try {
    const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
    const article = db
      .prepare("SELECT id, title, title_en, slug, category, created_at, published_at, images_json, final_image_main, final_image_sub FROM articles WHERE id = ?")
      .get(articleId) as Record<string, unknown> | undefined;
    db.close();
    return article ?? null;
  } catch {
    return null;
  }
}

function articleDirFromDbArticle(articleId: number, article?: Record<string, unknown> | null): string | null {
  const row = article ?? getDbArticle(articleId);
  if (!row) return null;
  const title = String(row.title_en || row.title || `article-${articleId}`);
  const dateValue = String(row.published_at || row.created_at || new Date().toISOString());
  const date = dateValue.match(/\d{4}-\d{2}-\d{2}/)?.[0] || new Date().toISOString().slice(0, 10);
  const rawSlug = String(row.slug || "").trim();
  const slug = rawSlug || slugify(title) || `article-${articleId}`;
  const dir = path.join(CONTENT_DIR_ROOT, contentCategory(row.category), `${date}-${slug}`);
  return existsSync(dir) ? dir : null;
}

function readMdxFrontmatter(articleDir: string): Record<string, unknown> {
  const mdxPath = path.join(articleDir, "index.mdx");
  if (!existsSync(mdxPath)) return {};
  try {
    return matter(readFileSync(mdxPath, "utf8")).data || {};
  } catch {
    return {};
  }
}

function resolveLocalSourcePath(url: string): string | null {
  const clean = String(url || "").split("?")[0].trim();
  if (!clean) return null;

  if (clean.includes("/images/articles/")) {
    const rel = clean.replace(/^.*?\/images\/articles\//, "");
    const candidate = path.join(PUBLIC_ARTICLES_DIR, rel);
    return existsSync(candidate) ? candidate : null;
  }

  const articleAssetMatch = clean.match(/^\/api\/article-assets\/(\d+)\/([^/?#]+)$/);
  if (articleAssetMatch) {
    const targetArticleId = Number(articleAssetMatch[1]);
    const targetFile = articleAssetMatch[2];
    const targetDir = articleDirFromDbArticle(targetArticleId);
    if (!targetDir) return null;
    const candidate = path.join(targetDir, "assets", targetFile);
    return existsSync(candidate) ? candidate : null;
  }

  if (clean.startsWith("/opt/") && existsSync(clean)) {
    return clean;
  }

  return null;
}

function resolveFallbackAssetPath(
  articleId: number,
  file: string,
  articleDir: string,
  article?: Record<string, unknown> | null
): string | null {
  const isMain = file.startsWith("main.");
  const isSubtitle = file.startsWith("subtitle.") || file.startsWith("sub.");
  const isInfographic = file.startsWith("infographic.");
  if (!isMain && !isSubtitle && !isInfographic) return null;

  const row = article ?? getDbArticle(articleId);
  const candidates: string[] = [];

  if (row?.images_json) {
    try {
      const parsed = JSON.parse(String(row.images_json));
      const slotKey = isMain ? "image_main" : isSubtitle ? "image_subtitle" : "image_infographic";
      const slot = parsed?.[slotKey];
      if (slot && typeof slot === "object" && typeof slot.url === "string") {
        candidates.push(slot.url);
      }
    } catch {}
  }

  if (isMain && typeof row?.final_image_main === "string") candidates.push(String(row.final_image_main));
  if (isSubtitle && typeof row?.final_image_sub === "string") candidates.push(String(row.final_image_sub));

  const mdxData = readMdxFrontmatter(articleDir);
  const mdxImage =
    isMain ? mdxData.image :
    isSubtitle ? mdxData.subtitleImage :
    mdxData.infographicImage;
  if (mdxImage && typeof mdxImage === "object" && typeof (mdxImage as { url?: unknown }).url === "string") {
    candidates.push(String((mdxImage as { url: string }).url));
  }

  for (const url of candidates) {
    const localPath = resolveLocalSourcePath(url);
    if (localPath) return localPath;
  }

  return null;
}

function findArticleDir(articleId: number): string | null {
  if (!articleId || !existsSync(CONTENT_DIR_ROOT)) return null;
  const dbDir = articleDirFromDbArticle(articleId);
  if (dbDir) return dbDir;
  try {
    for (const category of readdirSync(CONTENT_DIR_ROOT)) {
      const categoryDir = path.join(CONTENT_DIR_ROOT, category);
      if (!existsSync(categoryDir)) continue;
      try {
        if (!statSync(categoryDir).isDirectory()) continue;
      } catch {
        continue;
      }
      for (const entry of readdirSync(categoryDir)) {
        const articleDir = path.join(categoryDir, entry);
        try {
          if (!statSync(articleDir).isDirectory()) continue;
        } catch {
          continue;
        }
        const mdxPath = path.join(articleDir, "index.mdx");
        if (!existsSync(mdxPath)) continue;
        const head = readFileSync(mdxPath, "utf8").slice(0, 2500);
        if (head.includes(`db_id: ${articleId}`)) return articleDir;
      }
    }
  } catch {}
  return null;
}

function contentTypeFor(file: string) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".svg") return "image/svg+xml";
  return "image/jpeg";
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ articleId: string; file: string }> }
) {
  const params = await context.params;
  const articleId = Number(params.articleId);
  const file = params.file || "";

  if (!articleId || Number.isNaN(articleId)) {
    return new NextResponse("Bad Request", { status: 400 });
  }
  if (!file || file.includes("..") || file.includes("/") || file.includes("\\")) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const articleDir = findArticleDir(articleId);
  if (!articleDir) return new NextResponse("Not Found", { status: 404 });
  const article = getDbArticle(articleId);

  const assetPath = path.join(articleDir, "assets", file);
  const normalized = path.normalize(assetPath);
  const allowedRoot = path.join(articleDir, "assets") + path.sep;
  if (!normalized.startsWith(allowedRoot)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  let finalPath = normalized;
  if (!existsSync(finalPath)) {
    const fallbackPath = resolveFallbackAssetPath(articleId, file, articleDir, article);
    if (!fallbackPath) {
      return new NextResponse("Not Found", { status: 404 });
    }
    finalPath = fallbackPath;
  }

  if (!existsSync(finalPath)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return new NextResponse(readFileSync(finalPath), {
    headers: {
      "Content-Type": contentTypeFor(finalPath),
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}

export async function HEAD(
  req: NextRequest,
  context: { params: Promise<{ articleId: string; file: string }> }
) {
  const response = await GET(req, context);
  return new NextResponse(null, {
    status: response.status,
    headers: response.headers,
  });
}
