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
      child.kill("SIGKILL");
      resolve({ stdout, stderr: stderr + "\n[TIMEOUT]", code: 1 });
    }, timeoutMs);
    child.on("close", (code: number | null) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code: code ?? 1 });
    });
  });
}

function extractJsonFromOutput(stdout: string): unknown | null {
  // Last non-empty JSON line (skip any logger output)
  const lines = stdout.trim().split("\n").filter(Boolean);
  const jsonLine = [...lines].reverse().find((l) => l.trim().startsWith("{"));
  if (!jsonLine) return null;
  try {
    return JSON.parse(jsonLine);
  } catch {
    return null;
  }
}

// POST /api/manual-scrape  { url: string } or { urls: string[] }
export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_AGENT_PANEL !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { url, urls } = body;

  // --- Batch mode ---
  if (urls && Array.isArray(urls)) {
    const cleanUrls = urls
      .map((u: string) => (typeof u === "string" ? u.trim() : ""))
      .filter((u: string) => u.startsWith("http"));

    if (cleanUrls.length === 0) {
      return NextResponse.json(
        { error: "No valid URLs provided" },
        { status: 400 }
      );
    }

    if (cleanUrls.length > 20) {
      return NextResponse.json(
        { error: "Maximum 20 URLs per batch" },
        { status: 400 }
      );
    }

    const urlsJson = JSON.stringify(cleanUrls);
    const script = `
import asyncio, json, sys
sys.path.insert(0, '.')
from agents.manual_scraper import ManualScraper

async def main():
    scraper = ManualScraper()
    result = await scraper.process_urls(${JSON.stringify(urlsJson)
      .replace(/^"/, "json.loads('")
      .replace(/"$/, "')")}, requested_by='batch-frontend')
    print(json.dumps(result, ensure_ascii=False))

asyncio.run(main())
`;

    // Batch timeout: 200s per URL, max 600s
    const batchTimeout = Math.min(cleanUrls.length * 200000, 600000);
    const { stdout, stderr, code } = await runPython(script, batchTimeout);

    if (code !== 0 || !stdout.trim()) {
      const errLine = (stderr || "")
        .split("\n")
        .filter(Boolean)
        .slice(-3)
        .join(" | ");
      return NextResponse.json(
        { error: "Batch scrape failed", detail: errLine },
        { status: 500 }
      );
    }

    const result = extractJsonFromOutput(stdout);
    if (!result) {
      return NextResponse.json(
        { error: "Parse error", raw: stdout.slice(-300) },
        { status: 500 }
      );
    }
    return NextResponse.json(result);
  }

  // --- Single URL mode ---
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

  const { stdout, stderr, code } = await runPython(script, 200000);

  if (code !== 0 || !stdout.trim()) {
    const errLine = (stderr || "")
      .split("\n")
      .filter(Boolean)
      .slice(-3)
      .join(" | ");
    return NextResponse.json(
      { error: "Scrape failed", detail: errLine },
      { status: 500 }
    );
  }

  const result = extractJsonFromOutput(stdout);
  if (!result) {
    return NextResponse.json(
      { error: "Parse error", raw: stdout.slice(-300) },
      { status: 500 }
    );
  }
  return NextResponse.json(result);
}
