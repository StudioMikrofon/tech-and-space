import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";

const DB_PATH = "/opt/openclaw/futurepulse/db/futurepulse.db";

export async function GET(req: NextRequest) {
  try {
    const db = new Database(DB_PATH, { readonly: true, timeout: 5000, fileMustExist: true });

    // Get current/recent image generation activity (last 1 hour)
    const onehourago = new Date(Date.now() - 3600000).toISOString().slice(0, 19);

    const activities = db.prepare(`
      SELECT
        article_id,
        operation,
        image_type,
        status,
        created_at,
        error_msg,
        (SELECT title_en FROM articles WHERE id = image_operations.article_id) as article_title
      FROM image_operations
      WHERE created_at > ?
      ORDER BY created_at DESC
      LIMIT 30
    `).all(onehourago) as Record<string, unknown>[];

    // Count by status and operation
    const counts = db.prepare(`
      SELECT operation, status, COUNT(*) as count
      FROM image_operations
      WHERE created_at > ?
      GROUP BY operation, status
    `).all(onehourago) as Array<{ operation: string; status: string; count: number }>;

    db.close();

    return NextResponse.json({
      activities,
      counts,
      timestamp: new Date().toISOString()
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg, activities: [], counts: [] }, { status: 500 });
  }
}
