import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

const FP_DIR = "/opt/openclaw/futurepulse";

function runPython(script: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const child = spawn(`${FP_DIR}/venv/bin/python3`, ["-c", script], {
      cwd: FP_DIR,
      env: { ...process.env, PYTHONPATH: FP_DIR },
    });
    let stdout = "", stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("close", (code) => resolve({ stdout, stderr, code: code ?? 1 }));
  });
}

// POST /api/publish-local  { articleId: number }
// Writes MDX + images to local workspace, rebuilds test site
export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_AGENT_PANEL !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { articleId } = await req.json();
  if (!articleId) return NextResponse.json({ error: "Missing articleId" }, { status: 400 });

  const script = `
import sys, json
sys.path.insert(0, '${FP_DIR}')
from core.github_uploader import convert_to_mdx, convert_to_mdx_hr, _parse_images_json
from core.db import Database
import shutil, os
from pathlib import Path

WORKSPACE = Path('/opt/openclaw/workspace/tech-pulse-css')
CONTENT_DIR = WORKSPACE / 'content'
PUBLIC_IMAGES = WORKSPACE / 'public' / 'images' / 'articles'
FP_IMAGES = Path('${FP_DIR}/images')

db = Database()
conn = db.get_conn()
row = conn.execute("""
  SELECT id, title, title_en, category, lead, part1, part2, part1_en, part2_en,
         subtitle, subtitle_en, endings_json, endings_en, chosen_ending,
         images_json, source_url, source_name, published_at, created_at, score,
         pipeline_stage, status, geo_json
  FROM articles WHERE id=?
""", (${articleId},)).fetchone()
conn.close()

if not row:
    print(json.dumps({'ok': False, 'error': 'Article not found'}))
    sys.exit(1)

article = dict(row)

# Convert to MDX
mdx_en, cat_folder, slug, date, images_info = convert_to_mdx(article)
mdx_hr = convert_to_mdx_hr(article, slug, date, cat_folder, images_info)

# Write EN MDX
folder = CONTENT_DIR / cat_folder / f'{date}-{slug}'
folder.mkdir(parents=True, exist_ok=True)
(folder / 'index.mdx').write_text(mdx_en, encoding='utf-8')
(folder / 'index.hr.mdx').write_text(mdx_hr, encoding='utf-8')

# Copy images
img_folder = PUBLIC_IMAGES / slug
img_folder.mkdir(parents=True, exist_ok=True)

copied = []
imgs = _parse_images_json(article)
for img_type, key in [('main', 'image_main'), ('subtitle', 'image_subtitle')]:
    img_info = imgs.get(key, {})
    src_url = img_info.get('url', '') if isinstance(img_info, dict) else ''
    if not src_url:
        continue
    # Try public/images/articles path first
    if src_url.startswith('/images/articles/'):
        src = WORKSPACE / 'public' / src_url.lstrip('/')
    else:
        src = Path(src_url) if src_url.startswith('/') else FP_IMAGES / Path(src_url).name
    if src.exists():
        ext = src.suffix
        dst = img_folder / f'{img_type}{ext}'
        shutil.copy2(src, dst)
        copied.append(str(dst))

# Update DB status
conn = db.get_conn()
conn.execute("UPDATE articles SET status='published', pipeline_stage='published', github_uploaded=1, published_at=datetime('now') WHERE id=?", (${articleId},))
conn.commit()
conn.close()

print(json.dumps({
    'ok': True,
    'slug': slug,
    'folder': str(folder.relative_to(WORKSPACE)),
    'images_copied': len(copied),
    'en_path': str((folder / 'index.mdx').relative_to(WORKSPACE)),
    'hr_path': str((folder / 'index.hr.mdx').relative_to(WORKSPACE)),
}))
`;

  const result = await runPython(script);

  if (result.code !== 0) {
    console.error("publish-local stderr:", result.stderr);
    return NextResponse.json({ error: result.stderr || "Python error", ok: false }, { status: 500 });
  }

  try {
    const data = JSON.parse(result.stdout.trim().split("\n").pop() || "{}");
    if (!data.ok) return NextResponse.json(data, { status: 404 });

    // Trigger rebuild in background (non-blocking)
    const rebuild = spawn("bash", ["-c",
      "cd /opt/openclaw/workspace/tech-pulse-css && npm run build >> /tmp/rebuild.log 2>&1 && systemctl restart tech-pulse-test"
    ], { detached: true, stdio: "ignore" });
    rebuild.unref();

    return NextResponse.json({ ...data, rebuilding: true });
  } catch {
    return NextResponse.json({ error: "Parse error", raw: result.stdout }, { status: 500 });
  }
}
