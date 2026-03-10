import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

const WORKSPACE = "/opt/openclaw/workspace/tech-pulse-css";

function runGit(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const child = spawn("git", args, { cwd: WORKSPACE });
    let stdout = "", stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("close", (code) => resolve({ stdout, stderr, code: code ?? 1 }));
  });
}

// GET /api/sync-github — status (how many files changed)
export async function GET() {
  const status = await runGit(["status", "--porcelain"]);
  const lines = status.stdout.trim().split("\n").filter(Boolean);
  const log = await runGit(["log", "--oneline", "-5"]);
  return NextResponse.json({
    changed_files: lines.length,
    files: lines.slice(0, 20),
    recent_commits: log.stdout.trim().split("\n").filter(Boolean),
  });
}

// POST /api/sync-github — commit + push
export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_AGENT_PANEL !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Stage all content + images
  const add = await runGit(["add", "content/", "public/images/articles/"]);
  if (add.code !== 0) {
    return NextResponse.json({ error: `git add failed: ${add.stderr}` }, { status: 500 });
  }

  // Check if anything to commit
  const status = await runGit(["status", "--porcelain"]);
  const changed = status.stdout.trim().split("\n").filter(Boolean);
  if (changed.length === 0) {
    return NextResponse.json({ ok: true, message: "Nema promjena za sync.", pushed: false });
  }

  // Commit
  const now = new Date().toISOString().slice(0, 16).replace("T", " ");
  const commit = await runGit(["commit", "-m", `sync: ${changed.length} članaka [${now}]`]);
  if (commit.code !== 0) {
    return NextResponse.json({ error: `git commit failed: ${commit.stderr}` }, { status: 500 });
  }

  // Push (non-blocking — Vercel will auto-deploy)
  const push = spawn("git", ["push"], { cwd: WORKSPACE, detached: true, stdio: "ignore" });
  push.unref();

  return NextResponse.json({
    ok: true,
    pushed: true,
    files_synced: changed.length,
    message: `✅ ${changed.length} datoteka pushano na GitHub. Vercel deploya...`,
  });
}
