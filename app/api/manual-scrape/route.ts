import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

const FP_DIR = "/opt/openclaw/futurepulse";

function runPython(
  script: string,
  timeoutMs = 120000
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const child = spawn(`${FP_DIR}/venv/bin/python3`, ["-c", script], {
      cwd: FP_DIR,
      env: { ...process.env, PYTHONPATH: FP_DIR },
    });
    let stdout = "",
      stderr = "";
    child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    const timer = setTimeout(() => {
      child.kill();
      resolve({ stdout, stderr: stderr + "\n[TIMEOUT]", code: 1 });
    }, timeoutMs);
    child.on("close", (code: number | null) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code: code ?? 1 });
    });
  });
}

// POST /api/manual-scrape  { url: string }
export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_AGENT_PANEL !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { url } = body;
  if (!url || !url.startsWith("http")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const script = `
import asyncio, json, sys
sys.path.insert(0, '.')
from agents.manual_scraper import ManualScraper

async def main():
    scraper = ManualScraper()
    result = await scraper.process_url(${JSON.stringify(url)}, requested_by='frontend')
    print(json.dumps(result, ensure_ascii=False))

asyncio.run(main())
`;

  const { stdout, code } = await runPython(script, 90000);

  if (code !== 0 || !stdout.trim()) {
    return NextResponse.json({ error: "Scrape failed" }, { status: 500 });
  }

  try {
    const result = JSON.parse(stdout.trim().split("\n").pop() || "{}");
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Parse error" }, { status: 500 });
  }
}
