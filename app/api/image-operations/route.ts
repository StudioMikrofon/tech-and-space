import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";

const DB_PATH = "/opt/openclaw/futurepulse/db/futurepulse.db";

function getDb(readonly = true) {
  return new Database(DB_PATH, { readonly, timeout: 5000 });
}

export async function GET(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_AGENT_PANEL !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const articleId = url.searchParams.get("article_id");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);

  if (!articleId) {
    return NextResponse.json({ error: "Missing article_id" }, { status: 400 });
  }

  try {
    const db = getDb();
    const logs = db
      .prepare(
        `
      SELECT operation, image_type, source, status, error_msg, created_at
      FROM image_operations
      WHERE article_id = ?
      ORDER BY created_at DESC
      LIMIT ?
      `
      )
      .all(parseInt(articleId), limit) as Array<{
      operation: string;
      image_type: string | null;
      source: string | null;
      status: string;
      error_msg: string | null;
      created_at: string;
    }>;

    db.close();

    return NextResponse.json({
      article_id: parseInt(articleId),
      logs: logs.map((log) => ({
        ...log,
        timestamp: new Date(log.created_at).toISOString(),
      })),
      count: logs.length,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
