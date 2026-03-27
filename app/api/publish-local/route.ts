import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { bumpContentVersion } from "@/lib/content";

const FP_DIR = "/opt/openclaw/futurepulse";

function runPython(script: string, timeoutMs = 300000): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const child = spawn(`${FP_DIR}/venv/bin/python3`, ["-c", script], {
      cwd: FP_DIR,
      env: { ...process.env, PYTHONPATH: FP_DIR },
    });
    let stdout = "", stderr = "";
    child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    const timer = setTimeout(() => { child.kill(); resolve({ stdout, stderr: stderr + "\n[TIMEOUT]", code: 1 }); }, timeoutMs);
    child.on("close", (code: number | null) => { clearTimeout(timer); resolve({ stdout, stderr, code: code ?? 1 }); });
  });
}

// POST /api/publish-local  { articleId: number, chosen_ending?: string }
// Auto-publish: generates missing EN text, generates missing images, publishes with both files.
export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_AGENT_PANEL !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { articleId, chosen_ending } = body;
  if (!articleId) return NextResponse.json({ error: "Missing articleId" }, { status: 400 });

  const script = `
import sys, json, asyncio, logging
sys.path.insert(0, '${FP_DIR}')
logging.basicConfig(level=logging.WARNING)

from core.db import Database
from core.github_uploader import convert_to_mdx, convert_to_mdx_hr, _parse_images_json
import shutil
from pathlib import Path

WORKSPACE = Path('/opt/openclaw/workspace/tech-pulse-css')
CONTENT_DIR = WORKSPACE / 'content'
PUBLIC_IMAGES = WORKSPACE / 'public' / 'images' / 'articles'
FP_IMAGES = Path('${FP_DIR}/images')

CHOSEN_ENDING = ${chosen_ending ? JSON.stringify(chosen_ending) : "None"}

def load_article(db):
    conn = db.get_conn()
    row = conn.execute("""
      SELECT id, title, title_en, category, lead, part1, part2, part1_en, part2_en,
             subtitle, subtitle_en, endings_json, endings_en, chosen_ending,
             images_json, source_url, source_name, published_at, created_at, score,
             pipeline_stage, status, geo_json, exec_summary,
             selected_ending_id, final_body_hr, final_body_en,
             meta_tags_json, key_points_hr, key_points_en,
             summary_block_hr, summary_block_en,
             seo_title_en, seo_description_en, seo_keywords_en
      FROM articles WHERE id=?
    """, (${articleId},)).fetchone()
    conn.close()
    return dict(row) if row else None

db = Database()
article = load_article(db)
if not article:
    print(json.dumps({'ok': False, 'error': 'Article not found'}))
    sys.exit(1)

# Auto-pick random ending if none provided and none already chosen
if not CHOSEN_ENDING:
    existing_ending = (article.get('chosen_ending') or '').strip()
    if not existing_ending:
        try:
            import random
            endings = json.loads(article.get('endings_json') or '{}')
            available = [k for k in ['A', 'B', 'C'] if k in endings and endings[k]]
            if available:
                CHOSEN_ENDING = random.choice(available)
        except Exception:
            pass

# Save chosen_ending if we have one (provided or auto-selected)
if CHOSEN_ENDING:
    conn = db.get_conn()
    conn.execute("UPDATE articles SET chosen_ending=? WHERE id=?", (CHOSEN_ENDING, ${articleId}))
    conn.commit()
    conn.close()
    article['chosen_ending'] = CHOSEN_ENDING

async def ensure_en(article):
    """Generate English content if missing."""
    title_en = (article.get('title_en') or '').strip()
    part1_en = (article.get('part1_en') or '').strip()
    if title_en and part1_en:
        return True
    try:
        from agents.writer import WriterAgent
        writer = WriterAgent()
        item = {
            'title': article.get('title_en') or article.get('title', ''),
            'snippet': (article.get('part1') or '')[:500],
            'source_name': article.get('source_name') or 'source',
            'category': article.get('category', 'tech'),
            'url': article.get('source_url') or '',
        }
        ok = await writer.write_article_en(${articleId}, item, [])
        return ok
    except Exception as e:
        print(json.dumps({'ok': False, 'error': f'EN generation failed: {e}'}))
        return False

async def ensure_images(article):
    """
    Ensure article has images.
    Skip entirely if source is YouTube — video embed replaces hero image.
    Priority: web pull (og:image / Wikimedia / Unsplash) → AI generation fallback.
    """
    import re as _re
    src = (article.get('source_url') or '')
    if _re.search(r'youtu\.be/|youtube\.com/', src):
        return True  # YouTube article — no image needed

    try:
        raw = article.get('images_json', '') or '{}'
        data = json.loads(raw) if isinstance(raw, str) else {}
        main_url = (data.get('image_main') or {}).get('url', '')
        if main_url:
            # CRITICAL: Verify the image file actually exists on disk!
            # Stale images_json URLs (deleted/moved files) are the #1 cause of imageless articles.
            if main_url.startswith('/images/articles/'):
                check_path = WORKSPACE / 'public' / main_url.lstrip('/')
            else:
                check_path = FP_IMAGES / Path(main_url).name
            if check_path.exists():
                return True  # Image file verified on disk
            else:
                print(f'WARN: images_json URL exists but file missing: {check_path}', file=sys.stderr)
                # Fall through to re-generate images
    except Exception:
        pass

    # Step 1: try web pull first (fast, free, real photos)
    try:
        from agents.web_image_puller import WebImagePuller
        puller = WebImagePuller()
        pull_result = await puller.pull(${articleId})
        if pull_result.get('ok') and pull_result.get('images_found', 0) > 0:
            return True  # Web images found and saved
    except Exception as e:
        pass  # Non-fatal — fall through to AI generation

    # Step 2: AI generation fallback
    try:
        from agents.image_gen import ImageGenerator
        gen = ImageGenerator()
        conn = db.get_conn()
        row = conn.execute(
            'SELECT id, title, title_en, subtitle, subtitle_en, category, part1, part1_en, part2, part2_en FROM articles WHERE id=?',
            (${articleId},)
        ).fetchone()
        conn.close()
        if not row:
            return False
        result = await gen.generate_for_article(dict(row))
        return result and result.get('success')
    except Exception as e:
        # Image gen failure is non-fatal — publish without images
        return False

async def auto_select_hero(article_id):
    """If images_json has no image_main, auto-bind existing default images."""
    try:
        from pathlib import Path
        import re as _re
        pub_dir = Path('/opt/openclaw/workspace/tech-pulse-css/public/images/articles')
        legacy_dir = Path('${FP_DIR}/images')
        if not pub_dir.exists() and not legacy_dir.exists():
            return

        # Try to find the article's image folder
        conn = db.get_conn()
        row = conn.execute('SELECT title_en, title FROM articles WHERE id=?', (article_id,)).fetchone()
        images_row = conn.execute('SELECT images_json FROM articles WHERE id=?', (article_id,)).fetchone()
        conn.close()

        if not row:
            return

        # Check if image_main already set
        try:
            existing = json.loads((images_row[0] or '{}') if images_row else '{}')
            if existing.get('image_main', {}).get('url'):
                return  # Already has hero
        except Exception:
            existing = {}

        # Derive slug from title_en
        def slugify(text, max_len=50):
            char_map = {'č':'c','ć':'c','š':'s','ž':'z','đ':'dj'}
            t = text.lower()
            for src, dst in char_map.items():
                t = t.replace(src, dst)
            t = t.encode('ascii', 'ignore').decode()
            t = _re.sub(r'[^a-z0-9]+', '-', t).strip('-')
            return t[:max_len]

        title_en = (row[0] or row[1] or '').strip()
        if not title_en:
            return
        slug = slugify(title_en)

        # Find image folder
        folder = None
        if pub_dir.exists():
            for candidate in pub_dir.iterdir():
                if not candidate.is_dir():
                    continue
                if candidate.name == slug or candidate.name.endswith('-' + slug):
                    folder = candidate
                    break

        exts = {'.jpg', '.jpeg', '.png', '.webp'}
        if folder:
            files = sorted([f for f in folder.iterdir() if f.suffix.lower() in exts])
            main_file = next((f for f in files if f.stem.lower() == 'main'), files[0] if files else None)
            sub_file = next((f for f in files if f.stem.lower() == 'subtitle'), None)
            if main_file:
                main_url = f'/images/articles/{folder.name}/{main_file.name}'
                existing['image_main'] = {'url': main_url, 'alt': title_en}
            if sub_file:
                sub_url = f'/images/articles/{folder.name}/{sub_file.name}'
                existing['image_subtitle'] = {'url': sub_url, 'alt': title_en}

        # Legacy fallback: generated files may still only exist as art{id}_main/_sub
        if 'image_main' not in existing and legacy_dir.exists():
            legacy_files = sorted([f for f in legacy_dir.iterdir() if f.is_file() and f.suffix.lower() in exts and f.name.startswith(f'art{article_id}_')])
            legacy_main = next((f for f in legacy_files if '_main_' in f.name.lower()), None)
            legacy_sub = next((f for f in legacy_files if '_sub_' in f.name.lower()), None)

            if legacy_main or legacy_sub:
                target_folder = pub_dir / slug
                target_folder.mkdir(parents=True, exist_ok=True)

                if legacy_main:
                    target_main = target_folder / f'main{legacy_main.suffix.lower()}'
                    shutil.copy2(legacy_main, target_main)
                    existing['image_main'] = {'url': f'/images/articles/{slug}/{target_main.name}', 'alt': title_en}

                if legacy_sub:
                    target_sub = target_folder / f'subtitle{legacy_sub.suffix.lower()}'
                    shutil.copy2(legacy_sub, target_sub)
                    existing['image_subtitle'] = {'url': f'/images/articles/{slug}/{target_sub.name}', 'alt': title_en}

        if not existing.get('image_main', {}).get('url'):
            return

        conn = db.get_conn()
        conn.execute('UPDATE articles SET images_json=? WHERE id=?', (json.dumps(existing), article_id))
        conn.commit()
        conn.close()
    except Exception:
        pass  # Non-fatal

def ensure_final_bodies(article_id):
    """Persist canonical selected_ending_id + final_body_hr/en before MDX conversion."""
    article_now = load_article(db)
    if not article_now:
        raise ValueError('Article disappeared before final body assembly')

    ending_id = (article_now.get('selected_ending_id') or article_now.get('chosen_ending') or '').strip()
    if not ending_id:
        return

    endings_hr_raw = article_now.get('endings_json') or '{}'
    endings_en_raw = article_now.get('endings_en') or '{}'
    final_body_hr = (article_now.get('final_body_hr') or '').strip()
    final_body_en = (article_now.get('final_body_en') or '').strip()

    if final_body_hr and final_body_en and article_now.get('selected_ending_id') == ending_id:
        return

    try:
        endings_hr = json.loads(endings_hr_raw) if isinstance(endings_hr_raw, str) else (endings_hr_raw or {})
        endings_en = json.loads(endings_en_raw) if isinstance(endings_en_raw, str) else (endings_en_raw or {})
    except Exception as e:
        raise ValueError(f'Invalid endings JSON: {e}')

    selected_ending_hr = (endings_hr.get(ending_id) or '').strip()
    selected_ending_en = (endings_en.get(ending_id) or '').strip()
    if not selected_ending_hr or not selected_ending_en:
        raise ValueError(f'Missing ending content for {ending_id}')

    part1_hr = (article_now.get('part1') or '').strip()
    part2_hr = (article_now.get('part2') or '').strip()
    part1_en = (article_now.get('part1_en') or '').strip()
    part2_en = (article_now.get('part2_en') or '').strip()

    hr_parts = [p for p in [part1_hr, part2_hr] if p]
    en_parts = [p for p in [part1_en, part2_en] if p]

    assembled_hr = "\\n\\n<ArticleBreak />\\n\\n".join(hr_parts) if len(hr_parts) > 1 else (hr_parts[0] if hr_parts else '')
    assembled_en = "\\n\\n<ArticleBreak />\\n\\n".join(en_parts) if len(en_parts) > 1 else (en_parts[0] if en_parts else '')

    final_body_hr = "\\n\\n".join([p for p in [assembled_hr, selected_ending_hr] if p]).strip()
    final_body_en = "\\n\\n".join([p for p in [assembled_en, selected_ending_en] if p]).strip()

    conn = db.get_conn()
    conn.execute(
        "UPDATE articles SET selected_ending_id=?, final_body_hr=?, final_body_en=?, chosen_ending=? WHERE id=?",
        (ending_id, final_body_hr, final_body_en, ending_id, article_id)
    )
    conn.commit()
    conn.close()

async def main():
    en_ok = await ensure_en(article)
    if not en_ok:
        # already printed error
        return

    imgs_ok = await ensure_images(article)
    # Non-fatal if images fail — publish anyway

    # Auto-select hero image if images_json has no image_main yet
    await auto_select_hero(${articleId})
    ensure_final_bodies(${articleId})

asyncio.run(main())

# Re-fetch article from DB after potential updates
article = load_article(db)
if not article:
    print(json.dumps({'ok': False, 'error': 'Article disappeared from DB'}))
    sys.exit(1)

# Final check: must have EN content
title_en = (article.get('title_en') or '').strip()
part1_en = (article.get('part1_en') or '').strip()
if not title_en or not part1_en:
    print(json.dumps({'ok': False, 'error': 'EN content still missing after generation attempt'}))
    sys.exit(1)

# Record actual publish time in DB, but use created_at (scrape time) for MDX date
from datetime import datetime as _dt
_publish_time = _dt.utcnow().strftime('%Y-%m-%d %H:%M:%S')
conn = db.get_conn()
conn.execute("UPDATE articles SET published_at=? WHERE id=?", (_publish_time, ${articleId}))
conn.commit()
conn.close()
# MDX date = scraping time (created_at), not publish time
_scrape_time = (article.get('created_at') or '').strip()
article['published_at'] = _scrape_time if _scrape_time else _publish_time

# Convert to MDX
try:
    mdx_en, cat_folder, slug, date, images_info = convert_to_mdx(article)
except Exception as e:
    print(json.dumps({'ok': False, 'error': f'MDX conversion failed: {e}'}))
    sys.exit(1)

mdx_hr = convert_to_mdx_hr(article, slug, date, cat_folder, images_info)

# Write MDX files
folder = CONTENT_DIR / cat_folder / f'{date}-{slug}'
folder.mkdir(parents=True, exist_ok=True)
(folder / 'index.mdx').write_text(mdx_en, encoding='utf-8')
(folder / 'index.hr.mdx').write_text(mdx_hr, encoding='utf-8')

# Copy images
img_folder = PUBLIC_IMAGES / slug
img_folder.mkdir(parents=True, exist_ok=True)

copied = []
imgs = _parse_images_json(article)
for img_type, key in [('main', 'main_url'), ('subtitle', 'subtitle_url')]:
    src_url = imgs.get(key, '') or ''
    if not src_url:
        continue

    src = None
    # Strategy 1: resolve from images_json URL
    if src_url.startswith('/images/articles/'):
        candidate = WORKSPACE / 'public' / src_url.lstrip('/')
        if candidate.exists():
            src = candidate
    if src is None:
        # Strategy 2: look in FP_IMAGES by basename
        candidate = FP_IMAGES / Path(src_url).name
        if candidate.exists():
            src = candidate
    if src is None:
        # Strategy 3: scan ALL images_json URL directories for the file
        # Handles case where images_json has a different slug than current slug
        if '/images/articles/' in src_url:
            src_dir = WORKSPACE / 'public' / src_url.lstrip('/').rsplit('/', 1)[0]
            if src_dir.exists():
                for f in src_dir.iterdir():
                    if f.is_file() and f.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp'):
                        if (img_type == 'main' and ('main' in f.stem.lower() or '_main_' in f.name.lower())) or \
                           (img_type == 'subtitle' and ('sub' in f.stem.lower() or '_sub_' in f.name.lower())):
                            src = f
                            break
    if src is None:
        # Strategy 4: scan target folder for existing main/subtitle files
        for ext_try in ('.jpg', '.jpeg', '.png', '.webp'):
            candidate = img_folder / f'{img_type}{ext_try}'
            if candidate.exists():
                copied.append(str(candidate))
                break
        # Strategy 5: scan FP_IMAGES for art{id}_main/sub files
        if img_type not in [Path(c).stem.split('.')[0] for c in copied]:
            art_prefix = f'art{article.get("id", 0)}_'
            search_pattern = '_main_' if img_type == 'main' else '_sub_'
            for f in sorted(FP_IMAGES.iterdir(), reverse=True) if FP_IMAGES.exists() else []:
                if f.name.startswith(art_prefix) and search_pattern in f.name.lower() and f.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp'):
                    src = f
                    break
        if src is None:
            continue

    ext = src.suffix
    dst = img_folder / f'{img_type}{ext}'
    if src.resolve() != dst.resolve():
        shutil.copy2(src, dst)
    copied.append(str(dst))

# Update images_json to canonical paths after copy, so future operations use correct URLs
if copied:
    canonical_imgs = {}
    for c in copied:
        cp = Path(c)
        canon_url = f'/images/articles/{slug}/{cp.name}'
        if cp.stem.startswith('main'):
            canonical_imgs['image_main'] = {'url': canon_url, 'alt': article.get('title_en', '')}
        elif cp.stem.startswith('subtitle'):
            canonical_imgs['image_subtitle'] = {'url': canon_url, 'alt': article.get('subtitle_en', '')}
    if canonical_imgs:
        try:
            existing_imgs = json.loads(article.get('images_json', '{}') or '{}')
            # Preserve metadata (prompts, providers) but update URLs
            for k, v in canonical_imgs.items():
                if k in existing_imgs and isinstance(existing_imgs[k], dict):
                    existing_imgs[k]['url'] = v['url']
                else:
                    existing_imgs[k] = v
            conn = db.get_conn()
            conn.execute("UPDATE articles SET images_json=? WHERE id=?", (json.dumps(existing_imgs), ${articleId}))
            conn.commit()
            conn.close()
        except Exception:
            pass  # Non-fatal: canonical URL update is best-effort

# Update DB status (published_at already set above)
conn = db.get_conn()
conn.execute("UPDATE articles SET status='published', pipeline_stage='published', github_uploaded=1 WHERE id=?", (${articleId},))
conn.commit()
conn.close()

print(json.dumps({
    'ok': True,
    'slug': slug,
    'folder': str(folder.relative_to(WORKSPACE)),
    'images_copied': len(copied),
    'en_path': str((folder / 'index.mdx').relative_to(WORKSPACE)),
    'hr_path': str((folder / 'index.hr.mdx').relative_to(WORKSPACE)),
    'has_images': len(copied) > 0,
}))
`;

  const result = await runPython(script);

  let pyData: Record<string, unknown> = {};
  try {
    const lastLine = result.stdout.trim().split("\n").pop() || "{}";
    pyData = JSON.parse(lastLine);
  } catch {}

  if (result.code !== 0) {
    console.error("publish-local stderr:", result.stderr);
    const errMsg = (pyData.error as string) || result.stderr || "Python error";
    return NextResponse.json({ error: errMsg, ok: false }, { status: 400 });
  }

  try {
    const data = pyData;
    if (!data.ok) return NextResponse.json(data, { status: 400 });
    bumpContentVersion();
    return NextResponse.json({ ...data, rebuilding: false, live: true });
  } catch {
    return NextResponse.json({ error: "Parse error", raw: result.stdout }, { status: 500 });
  }
}
