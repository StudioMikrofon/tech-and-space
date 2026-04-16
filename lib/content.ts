import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { Article, Category, CATEGORIES, CATEGORY_COLORS } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");
const CONTENT_VERSION_FILE = path.join(process.cwd(), ".content-version");

// In-memory cache — avoids re-reading 200+ MDX files on every SSR request
const CACHE_TTL_MS = 300_000; // 5 minutes — prevents expensive re-reads during navigation
// CRITICAL: Increased from 30s because _readAllArticles() is synchronous and blocks main thread for 3-4 minutes
// when cache expires. With 1093 articles + 249 with malformed YAML (requires error handling),
// each cache miss causes 3-4 min freeze on Back/language-switch navigation.
let _articlesCache: Article[] | null = null;
let _articlesCacheTime = 0;
let _articlesHrCache: Article[] | null = null;
let _articlesHrCacheTime = 0;
let _contentVersionMtime = 0;

export function invalidateContentCache(): void {
  _articlesCache = null;
  _articlesCacheTime = 0;
  _articlesHrCache = null;
  _articlesHrCacheTime = 0;
  _contentVersionMtime = 0;
}

function getContentVersionMtime(): number {
  try {
    if (!fs.existsSync(CONTENT_VERSION_FILE)) {
      fs.writeFileSync(CONTENT_VERSION_FILE, String(Date.now()), "utf8");
    }
    return fs.statSync(CONTENT_VERSION_FILE).mtimeMs;
  } catch {
    return 0;
  }
}

export function bumpContentVersion(): void {
  try {
    fs.writeFileSync(CONTENT_VERSION_FILE, String(Date.now()), "utf8");
  } catch {
    // Best-effort only; cache falls back to TTL.
  }
  invalidateContentCache();
}

function refreshCacheIfVersionChanged(): void {
  const currentVersion = getContentVersionMtime();
  if (_contentVersionMtime !== currentVersion) {
    invalidateContentCache();
    _contentVersionMtime = currentVersion;
  }
}

function parseMdxFile(filePath: string, timeoutMs: number = 5000): Article | null {
  try {
    // Add timeout wrapper to prevent hangs on malformed files
    const startTime = Date.now();
    const raw = fs.readFileSync(filePath, "utf-8");

    if (Date.now() - startTime > timeoutMs) {
      console.warn(`[TIMEOUT] parseMdxFile took >5s for ${filePath}, skipping`);
      return null;
    }

    const { data, content } = matter(raw);
    const parseList = (value: unknown): string[] | undefined => {
      if (Array.isArray(value)) return value.map(String).filter(Boolean);
      if (typeof value === "string" && value.trim()) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
        } catch {
          return value.split("\n").map((line) => line.replace(/^-\s*/, "").trim()).filter(Boolean);
        }
      }
      return undefined;
    };
    const parseBool = (value: unknown): boolean => {
      if (typeof value === "boolean") return value;
      if (typeof value === "number") return value !== 0;
      if (typeof value === "string") return ["true", "1", "yes", "on"].includes(value.toLowerCase());
      return false;
    };

    // DEBUG: Log articles from 2026-04-08 that fail to parse
    if (filePath.includes("2026-04-08") && !data.approved) {
      console.warn(`[DEBUG] Rejected 2026-04-08 article: ${filePath}`);
      console.warn(`[DEBUG] approved field:`, data.approved, typeof data.approved);
      console.warn(`[DEBUG] keys in data:`, Object.keys(data).slice(0, 15));
    }

    if (!data.approved) return null;

    return {
      id: data.id,
      dbId: data.db_id ? Number(data.db_id) : undefined,
      title: data.title,
      titleEn: data.title_en,
      author: data.author,
      rewritten: parseBool(data.rewritten),
      rewrittenAt: data.rewritten_at,
      rewrittenBy: data.rewritten_by || data.author,
      rewrittenPersona: data.rewritten_persona,
      rewrittenAvatar: data.rewritten_avatar,
      rewrittenRole: data.rewritten_role,
      category: data.category as Category,
      date: data.date,
      scrapeDateDate: data.scrape_date || data.date, // Original scrape date, separate from edit date
      excerpt: data.excerpt,
      excerptEn: data.excerpt_en,
      execSummary: data.exec_summary,
      summaryBlock: data.summary_block || data.summary_block_hr, // PREMIUM SPEC: 3-4 sentence summary (HR)
      summaryBlockEn: data.summary_block_en || data.summary_block_hr, // PREMIUM SPEC: 3-4 sentence summary (EN)
      keyPoints: parseList(data.key_points) || parseList(data.key_points_hr),
      keyPointsEn: parseList(data.key_points_en) || parseList(data.key_points_hr),
      source: data.source,
      image: data.image,
      subtitle: data.subtitle,
      subtitleEn: data.subtitle_en,
      subtitleImage: data.subtitleImage,
      tags: data.tags || [],
      geo: data.geo,
      featured: data.featured || false,
      approved: data.approved,
      likes: data.likes ? Number(data.likes) : 0,
      content,
      part1En: data.part1_en,
      part2En: data.part2_en,
      leadSentenceEn: data.lead_sentence,
      videoUrl: data.videoUrl,
      lang: data.lang,
    };
  } catch (e) {
    // Silently skip articles that fail to parse (malformed YAML, etc.)
    return null;
  }
}

function _readAllArticles(): Article[] {
  const articles: Article[] = [];

  for (const category of CATEGORIES) {
    const categoryDir = path.join(CONTENT_DIR, category);
    if (!fs.existsSync(categoryDir)) continue;

    const entries = fs.readdirSync(categoryDir, { withFileTypes: true });
    for (const entry of entries) {
      let filePath: string;
      if (entry.isDirectory()) {
        // New format: content/{category}/{slug}/index.mdx
        const indexPath = path.join(categoryDir, entry.name, "index.mdx");
        if (!fs.existsSync(indexPath)) continue;
        filePath = indexPath;
      } else if (entry.name.endsWith(".mdx") && !entry.name.endsWith(".hr.mdx")) {
        // Old format: content/{category}/{slug}.mdx (skip .hr.mdx files)
        filePath = path.join(categoryDir, entry.name);
      } else {
        continue;
      }
      const article = parseMdxFile(filePath);
      if (article && article.lang !== 'hr') articles.push(article);
    }
  }

  return articles.sort((a, b) => {
    const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return (b.dbId ?? 0) - (a.dbId ?? 0);
  });
}

export function getAllArticles(): Article[] {
  refreshCacheIfVersionChanged();
  const now = Date.now();
  if (_articlesCache && now - _articlesCacheTime < CACHE_TTL_MS) return _articlesCache;

  // Load articles synchronously (blocking), but with extended timeout
  // CRITICAL: This is the source of 3-4 minute freezes on cache miss
  // With 5 minute TTL, this should rarely happen during normal navigation
  const startLoad = Date.now();
  _articlesCache = _readAllArticles();
  const loadTime = Date.now() - startLoad;

  if (loadTime > 1000) {
    console.warn(`[PERF] getAllArticles() took ${loadTime}ms to load ${_articlesCache.length} articles`);
  }

  _articlesCacheTime = now;
  return _articlesCache;
}

export function getArticleBySlug(
  category: string,
  id: string
): Article | null {
  refreshCacheIfVersionChanged();
  // Try new folder format first: content/{category}/{id}/index.mdx
  const folderPath = path.join(CONTENT_DIR, category, id, "index.mdx");
  if (fs.existsSync(folderPath)) return parseMdxFile(folderPath);
  // Fallback: old flat format content/{category}/{id}.mdx
  const filePath = path.join(CONTENT_DIR, category, `${id}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  return parseMdxFile(filePath);
}

// ── Croatian (HR) versions ────────────────────────────────────

export function getArticleBySlugHr(
  category: string,
  id: string
): Article | null {
  refreshCacheIfVersionChanged();
  // Try HR file: content/{category}/{id}/index.hr.mdx
  const hrPath = path.join(CONTENT_DIR, category, id, "index.hr.mdx");
  if (fs.existsSync(hrPath)) {
    const hrArticle = parseMdxFile(hrPath);
    if (hrArticle) {
      const enArticle = getArticleBySlug(category, id);
      if (enArticle) {
        return {
          ...enArticle,
          ...hrArticle,
          rewritten: hrArticle.rewritten || enArticle.rewritten,
          author: hrArticle.author || enArticle.author,
          rewrittenBy: hrArticle.rewrittenBy || enArticle.rewrittenBy || enArticle.author,
          rewrittenAvatar: hrArticle.rewrittenAvatar || enArticle.rewrittenAvatar,
          rewrittenPersona: hrArticle.rewrittenPersona || enArticle.rewrittenPersona,
          rewrittenRole: hrArticle.rewrittenRole || enArticle.rewrittenRole,
        };
      }
      return hrArticle;
    }
  }
  // Fallback to EN version
  return getArticleBySlug(category, id);
}

function _readAllArticlesHr(): Article[] {
  const articles: Article[] = [];

  for (const category of CATEGORIES) {
    const categoryDir = path.join(CONTENT_DIR, category);
    if (!fs.existsSync(categoryDir)) continue;

    const entries = fs.readdirSync(categoryDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const hrPath = path.join(categoryDir, entry.name, "index.hr.mdx");
      const enPath = path.join(categoryDir, entry.name, "index.mdx");
      const filePath = fs.existsSync(hrPath) ? hrPath : (fs.existsSync(enPath) ? enPath : null);
      if (!filePath) continue;
      const article = parseMdxFile(filePath);
      if (article) articles.push(article);
    }
  }

  return articles.sort((a, b) => {
    const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return (b.dbId ?? 0) - (a.dbId ?? 0);
  });
}

export function getAllArticlesHr(): Article[] {
  refreshCacheIfVersionChanged();
  const now = Date.now();
  if (_articlesHrCache && now - _articlesHrCacheTime < CACHE_TTL_MS) return _articlesHrCache;

  // Load articles synchronously (blocking), but with extended timeout
  // CRITICAL: This is the source of 3-4 minute freezes on cache miss
  // With 5 minute TTL, this should rarely happen during normal navigation
  const startLoad = Date.now();
  _articlesHrCache = _readAllArticlesHr();
  const loadTime = Date.now() - startLoad;

  if (loadTime > 1000) {
    console.warn(`[PERF] getAllArticlesHr() took ${loadTime}ms to load ${_articlesHrCache.length} articles`);
  }

  _articlesHrCacheTime = now;
  return _articlesHrCache;
}

export function getArticlesByCategory(category: Category): Article[] {
  return getAllArticles().filter((a) => a.category === category);
}

export function getArticlesByCategoryHr(category: Category): Article[] {
  return getAllArticlesHr().filter((a) => a.category === category);
}

export function getRelatedArticles(
  currentId: string,
  category: Category,
  tags: string[],
  limit = 4
): Article[] {
  const all = getAllArticles();
  const tagSet = new Set(tags);

  const scored = all
    .filter((a) => a.id !== currentId)
    .map((a) => {
      const sameCategory = a.category === category ? 2 : 0;
      const sharedTags = a.tags.filter((t) => tagSet.has(t)).length;
      return { article: a, score: sameCategory + sharedTags };
    })
    .filter((x) => x.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.article.date).getTime() - new Date(a.article.date).getTime()
    );

  return scored.slice(0, limit).map((x) => x.article);
}

export function getRelatedArticlesHr(
  currentId: string,
  category: Category,
  tags: string[],
  limit = 4
): Article[] {
  const all = getAllArticlesHr();
  const tagSet = new Set(tags);

  const scored = all
    .filter((a) => a.id !== currentId)
    .map((a) => {
      const sameCategory = a.category === category ? 2 : 0;
      const sharedTags = a.tags.filter((t) => tagSet.has(t)).length;
      return { article: a, score: sameCategory + sharedTags };
    })
    .filter((x) => x.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.article.date).getTime() - new Date(a.article.date).getTime()
    );

  return scored.slice(0, limit).map((x) => x.article);
}

export function getFeaturedArticle(): Article | null {
  const articles = getAllArticles();
  // Always show the newest article as featured (hero)
  return articles[0] || null;
}

export function getGeoArticles(): Article[] {
  return getAllArticles().filter(
    (a) => a.geo && a.geo.lat !== undefined && a.geo.lon !== undefined
  );
}

/**
 * Returns pins for the globe with category colors and recent article sizing
 */
export function getGlobePins(): Array<{
  lat: number;
  lng: number;
  label: string;
  color: string;
  id: string;
  size?: number;
}> {
  const geoArticles = getGeoArticles();
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  // Only show pins from last 48h; fallback to latest 5 if none recent
  let recent = geoArticles.filter(a => new Date(a.date) > twoDaysAgo);
  if (recent.length === 0) recent = geoArticles.slice(0, 5);

  return recent.map((article) => {
    const color = CATEGORY_COLORS[article.category] || "#00cfff";
    return {
      lat: article.geo.lat,
      lng: article.geo.lon,
      label: article.title.substring(0, 30),
      color,
      id: article.id,
      size: 4,
    };
  });
}

/**
 * Returns the latest article for each category (for the Global Feed sidebar).
 * Each category is represented by at most one article (the newest).
 */
export function getLatestPerCategory(): Article[] {
  const articles = getAllArticles();
  const seen = new Set<string>();
  const result: Article[] = [];

  for (const article of articles) {
    if (!seen.has(article.category)) {
      seen.add(article.category);
      result.push(article);
    }
  }
  return result;
}

/**
 * Returns the latest N articles per category, keyed by category name.
 * Used by the HeroSection carousel to cycle through multiple articles per category.
 */
export function getLatestPerCategoryMultiple(perCat: number = 4): Record<string, Article[]> {
  const articles = getAllArticles();
  const result: Record<string, Article[]> = {};

  for (const article of articles) {
    const cat = article.category;
    if (!result[cat]) result[cat] = [];
    if (result[cat].length < perCat) {
      result[cat].push(article);
    }
  }
  return result;
}
