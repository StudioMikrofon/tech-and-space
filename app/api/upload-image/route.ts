import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { spawn } from "child_process";

const WORKSPACE = "/opt/openclaw/workspace/tech-pulse-css";
const FP_DIR = "/opt/openclaw/futurepulse";

function updateDb(articleId: number, imageType: "main" | "subtitle", url: string, alt: string) {
  return new Promise<void>((resolve) => {
    const key = imageType === "main" ? "image_main" : "image_subtitle";
    const script = `
import sys, json
sys.path.insert(0, '${FP_DIR}')
from core.db import Database
db = Database()
conn = db.get_conn()
row = conn.execute('SELECT images_json FROM articles WHERE id=?', (${articleId},)).fetchone()
raw = row[0] if row else '{}'
try:
    imgs = json.loads(raw or '{}')
except:
    imgs = {}
imgs['${key}'] = {'url': '${url}', 'alt': '${alt}'}
conn.execute('UPDATE articles SET images_json=? WHERE id=?', (json.dumps(imgs), ${articleId}))
conn.commit()
conn.close()
print('ok')
`;
    const child = spawn(`${FP_DIR}/venv/bin/python3`, ["-c", script], { cwd: FP_DIR });
    child.on("close", () => resolve());
  });
}

function updateMdx(articleId: number, imageType: "main" | "subtitle", url: string, alt: string) {
  return new Promise<void>((resolve) => {
    const frontKey = imageType === "main" ? "image" : "subtitleImage";
    const script = `
import sys, re
sys.path.insert(0, '${FP_DIR}')
import sqlite3
conn = sqlite3.connect('${FP_DIR}/db/futurepulse.db')
row = conn.execute('SELECT title_en, category FROM articles WHERE id=?', (${articleId},)).fetchone()
conn.close()
if not row: sys.exit(0)

import pathlib, glob
content_dir = pathlib.Path('${WORKSPACE}/content')
for mdx in content_dir.rglob('index.mdx'):
    text = mdx.read_text(encoding='utf-8')
    if 'db_id: ${articleId}' not in text:
        continue
    fm_end = text.index('\\n---\\n', 4) + 5
    fm = text[4:fm_end-4]
    body = text[fm_end:]

    if '${frontKey}:' in fm:
        fm = re.sub(
            r'${frontKey}:\\s*\\n(?:  .*\\n)*',
            '${frontKey}:\\n  url: "${url}"\\n  alt: "${alt}"\\n',
            fm
        )
    else:
        fm = fm.rstrip() + '\\n${frontKey}:\\n  url: "${url}"\\n  alt: "${alt}"\\n'

    mdx.write_text('---\\n' + fm + '---\\n' + body, encoding='utf-8')
    print('updated:', str(mdx))
    break
`;
    const child = spawn(`${FP_DIR}/venv/bin/python3`, ["-c", script], { cwd: FP_DIR });
    child.on("close", () => resolve());
  });
}

export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_AGENT_PANEL !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contentType = req.headers.get("content-type") || "";

  let articleId: number;
  let imageType: "main" | "subtitle";
  let fileBuffer: Buffer;
  let ext: string;
  let altText: string;

  if (contentType.includes("multipart/form-data")) {
    // File upload
    const form = await req.formData();
    articleId = Number(form.get("articleId"));
    imageType = (form.get("imageType") as "main" | "subtitle") || "main";
    altText = (form.get("alt") as string) || "";
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const arr = await file.arrayBuffer();
    fileBuffer = Buffer.from(arr);
    const mime = file.type;
    ext = mime === "image/png" ? ".png" : mime === "image/webp" ? ".webp" : ".jpg";
  } else {
    // JSON with imageUrl to fetch
    const body = await req.json();
    articleId = Number(body.articleId);
    imageType = body.imageType || "main";
    altText = body.alt || "";
    const imageUrl: string = body.imageUrl;
    if (!imageUrl) return NextResponse.json({ error: "No imageUrl" }, { status: 400 });

    const resp = await fetch(imageUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!resp.ok) return NextResponse.json({ error: `Fetch failed: ${resp.status}` }, { status: 400 });
    const arr = await resp.arrayBuffer();
    fileBuffer = Buffer.from(arr);
    const ct = resp.headers.get("content-type") || "";
    ext = ct.includes("png") ? ".png" : ct.includes("webp") ? ".webp" : ".jpg";
  }

  if (!articleId || isNaN(articleId)) return NextResponse.json({ error: "Invalid articleId" }, { status: 400 });

  // Determine slug from DB
  const slugScript = `
import sys, sqlite3
conn = sqlite3.connect('${FP_DIR}/db/futurepulse.db')
row = conn.execute('SELECT title_en, title FROM articles WHERE id=${articleId}').fetchone()
conn.close()
if not row: sys.exit(1)
import re
title = (row[0] or row[1] or '').lower()
char_map = {'č':'c','ć':'c','š':'s','ž':'z','đ':'dj'}
for s,d in char_map.items(): title = title.replace(s,d)
title = title.encode('ascii','ignore').decode()
slug = re.sub(r'[^a-z0-9]+','-',title).strip('-')[:50]
print(slug)
`;
  const slugResult = await new Promise<string>((resolve) => {
    let out = "";
    const child = spawn(`${FP_DIR}/venv/bin/python3`, ["-c", slugScript]);
    child.stdout.on("data", (d) => (out += d.toString()));
    child.on("close", () => resolve(out.trim()));
  });

  if (!slugResult) return NextResponse.json({ error: "Article not found" }, { status: 404 });

  const imgDir = path.join(WORKSPACE, "public", "images", "articles", slugResult);
  if (!existsSync(imgDir)) await mkdir(imgDir, { recursive: true });

  const filename = imageType === "main" ? `main${ext}` : `subtitle${ext}`;
  const filePath = path.join(imgDir, filename);
  await writeFile(filePath, fileBuffer);

  const publicUrl = `/images/articles/${slugResult}/${filename}`;

  await updateDb(articleId, imageType, publicUrl, altText || slugResult);
  await updateMdx(articleId, imageType, publicUrl, altText || slugResult);

  return NextResponse.json({ ok: true, url: publicUrl });
}
