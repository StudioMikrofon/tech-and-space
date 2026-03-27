import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.resolve("/opt/openclaw/futurepulse/db/futurepulse.db");

function getDb() {
  return new Database(DB_PATH, { readonly: false });
}

// POST /api/like  { dbId: number }  — increments likes, returns new count
export async function POST(req: NextRequest) {
  try {
    const { dbId } = await req.json();
    if (!dbId || typeof dbId !== "number") {
      return NextResponse.json({ error: "Invalid dbId" }, { status: 400 });
    }

    const db = getDb();
    const row = db.prepare("SELECT likes FROM articles WHERE id = ?").get(dbId) as { likes: number } | undefined;
    if (!row) {
      db.close();
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    db.prepare("UPDATE articles SET likes = likes + 1 WHERE id = ?").run(dbId);
    const updated = db.prepare("SELECT likes FROM articles WHERE id = ?").get(dbId) as { likes: number };
    db.close();

    return NextResponse.json({ likes: updated.likes });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET /api/like?dbId=123  — returns current like count
export async function GET(req: NextRequest) {
  const dbId = Number(req.nextUrl.searchParams.get("dbId"));
  if (!dbId) return NextResponse.json({ error: "Missing dbId" }, { status: 400 });

  try {
    const db = getDb();
    const row = db.prepare("SELECT likes FROM articles WHERE id = ?").get(dbId) as { likes: number } | undefined;
    db.close();
    return NextResponse.json({ likes: row?.likes ?? 0 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
