import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync, readdirSync } from "fs";
import path from "path";

// Legacy dirs: kept for backward compat (old img_* and article_* files)
const LEGACY_DIRS = [
  "/opt/openclaw/futurepulse/images",
];

const PUBLIC_ARTICLES_DIR = "/opt/openclaw/workspace/tech-pulse-css/public/images/articles";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const file = url.searchParams.get("file");
  const folder = url.searchParams.get("folder"); // optional: specific subfolder

  if (!file || file.includes("..") || file.includes("/") || file.includes("\\")) {
    return new NextResponse("Bad Request", { status: 400 });
  }
  if (folder && (folder.includes("..") || folder.includes("\\"))) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  // If folder specified, look directly there first
  let filePath: string | undefined;
  if (folder && existsSync(PUBLIC_ARTICLES_DIR)) {
    const direct = path.join(PUBLIC_ARTICLES_DIR, folder, file);
    if (existsSync(direct)) filePath = direct;
  }

  // Try legacy dirs (for old art_* files)
  if (!filePath) {
    filePath = LEGACY_DIRS.map(d => path.join(d, file)).find(p => existsSync(p));
  }

  // Fallback: scan public/images/articles/ subdirs for the file
  if (!filePath && existsSync(PUBLIC_ARTICLES_DIR)) {
    try {
      const folders = readdirSync(PUBLIC_ARTICLES_DIR);
      for (const f of folders) {
        const candidate = path.join(PUBLIC_ARTICLES_DIR, f, file);
        if (existsSync(candidate)) {
          filePath = candidate;
          break;
        }
      }
    } catch {}
  }

  if (!filePath) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const data = readFileSync(filePath);
  const ext = path.extname(file).toLowerCase();
  const contentType =
    ext === ".png" ? "image/png" :
    ext === ".webp" ? "image/webp" :
    "image/jpeg";

  return new NextResponse(data, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
