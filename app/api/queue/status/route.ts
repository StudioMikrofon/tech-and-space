import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";

const DB_PATH = "/opt/openclaw/futurepulse/db/futurepulse.db";

export async function GET(req: NextRequest) {
  try {
    const db = new Database(DB_PATH, { readonly: true, timeout: 5000, fileMustExist: true });

    // Ensure task_queue table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS task_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id INTEGER,
        task_type TEXT,
        model TEXT,
        status TEXT DEFAULT 'pending',
        error_msg TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        done_at DATETIME,
        FOREIGN KEY (article_id) REFERENCES articles(id)
      )
    `);

    // Get active tasks (pending + running)
    const activeTasks = db.prepare(`
      SELECT
        id, article_id, task_type, model, status, error_msg,
        created_at, done_at,
        (SELECT title_en FROM articles WHERE id = task_queue.article_id) as article_title
      FROM task_queue
      WHERE status IN ('pending', 'running')
      ORDER BY created_at ASC
      LIMIT 50
    `).all() as Record<string, unknown>[];

    // Get task counts by status
    const counts = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM task_queue
      GROUP BY status
    `).all() as Array<{ status: string; count: number }>;

    const countMap: Record<string, number> = {};
    counts.forEach(row => {
      countMap[row.status] = row.count;
    });

    db.close();

    return NextResponse.json({
      active: activeTasks,
      counts: countMap,
      timestamp: new Date().toISOString()
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg, active: [], counts: {} }, { status: 500 });
  }
}
