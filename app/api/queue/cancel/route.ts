import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import { exec } from "child_process";
import { promisify } from "util";

const DB_PATH = "/opt/openclaw/futurepulse/db/futurepulse.db";
const execAsync = promisify(exec);

function getDb(readonly = false) {
  return new Database(DB_PATH, { readonly, timeout: 5000 });
}

export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_AGENT_PANEL !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { task_id } = body;

    if (!task_id) {
      return NextResponse.json({ error: "Missing task_id" }, { status: 400 });
    }

    const db = getDb();

    // Get task details
    const task = db
      .prepare("SELECT * FROM task_queue WHERE id = ?")
      .get(task_id) as {
      id: number;
      status: string;
      article_id: number;
    } | null;

    if (!task) {
      db.close();
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Can only cancel pending or running tasks
    if (!["pending", "running"].includes(task.status)) {
      db.close();
      return NextResponse.json(
        { error: `Cannot cancel task with status: ${task.status}` },
        { status: 400 }
      );
    }

    // Try to kill the process if running
    if (task.status === "running") {
      try {
        // Kill by task ID pattern (used in spawned processes)
        await execAsync(`pkill -f "task_id=${task_id}" || true`);
      } catch (e) {
        // Ignore kill errors
      }
    }

    // Mark task as cancelled
    db.prepare("UPDATE task_queue SET status = 'cancelled' WHERE id = ?").run(
      task_id
    );

    db.close();

    return NextResponse.json({
      ok: true,
      message: `Task #${task_id} cancelled`,
      task_id,
      article_id: task.article_id,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
