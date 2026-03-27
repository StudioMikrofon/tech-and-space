import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.resolve("/opt/openclaw/futurepulse/db/futurepulse.db");

// GET /api/most-liked?limit=6
// Returns top articles by likes count (only published ones with likes > 0)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "6"), 20);

  try {
    const db = new Database(DB_PATH, { readonly: true });
    const rows = db.prepare(`
      SELECT id, title_en, title, category, slug, published_at, likes, source_name, source_names, original_urls
      FROM articles
      WHERE github_uploaded = 1 AND likes > 0
      ORDER BY likes DESC, published_at DESC
      LIMIT ?
    `).all(limit) as Array<{
      id: number;
      title_en: string;
      title: string;
      category: string;
      slug: string;
      published_at: string;
      likes: number;
      source_name: string | null;
      source_names: string | null;
      original_urls: string | null;
    }>;
    db.close();

    const articles = rows.map(r => ({
      dbId: r.id,
      title: r.title_en || r.title,
      category: r.category,
      slug: r.slug,
      date: r.published_at,
      likes: r.likes,
    }));

    return NextResponse.json(articles);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
