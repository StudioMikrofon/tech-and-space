(()=>{var a={};a.id=277,a.ids=[277],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},12845:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>E,patchFetch:()=>D,routeModule:()=>z,serverHooks:()=>C,workAsyncStorage:()=>A,workUnitAsyncStorage:()=>B});var d={};c.r(d),c.d(d,{POST:()=>y});var e=c(19225),f=c(84006),g=c(8317),h=c(99373),i=c(34775),j=c(24235),k=c(261),l=c(54365),m=c(90771),n=c(73461),o=c(67798),p=c(92280),q=c(62018),r=c(45696),s=c(47929),t=c(86439),u=c(37527),v=c(45592),w=c(79646);let x="/opt/openclaw/futurepulse";async function y(a){let{articleId:b,chosen_ending:c}=await a.json();if(!b)return v.NextResponse.json({error:"Missing articleId"},{status:400});let d=`
import sys, json, asyncio, logging
sys.path.insert(0, '${x}')
logging.basicConfig(level=logging.WARNING)

from core.db import Database
from core.github_uploader import convert_to_mdx, convert_to_mdx_hr, _parse_images_json
import shutil
from pathlib import Path

WORKSPACE = Path('/opt/openclaw/workspace/tech-pulse-css')
CONTENT_DIR = WORKSPACE / 'content'
PUBLIC_IMAGES = WORKSPACE / 'public' / 'images' / 'articles'
FP_IMAGES = Path('${x}/images')

CHOSEN_ENDING = ${c?JSON.stringify(c):"None"}

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
    """, (${b},)).fetchone()
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
    conn.execute("UPDATE articles SET chosen_ending=? WHERE id=?", (CHOSEN_ENDING, ${b}))
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
        ok = await writer.write_article_en(${b}, item, [])
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
    if _re.search(r'youtu.be/|youtube.com/', src):
        return True  # YouTube article — no image needed

    try:
        raw = article.get('images_json', '') or '{}'
        data = json.loads(raw) if isinstance(raw, str) else {}
        if data.get('image_main', {}).get('url'):
            return True  # Already have images
    except Exception:
        pass

    # Step 1: try web pull first (fast, free, real photos)
    try:
        from agents.web_image_puller import WebImagePuller
        puller = WebImagePuller()
        pull_result = await puller.pull(${b})
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
            (${b},)
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
    """If images_json has no image_main, scan public folder and pick the first image file."""
    try:
        from pathlib import Path
        import re as _re
        pub_dir = Path('/opt/openclaw/workspace/tech-pulse-css/public/images/articles')
        if not pub_dir.exists():
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
        for candidate in pub_dir.iterdir():
            if not candidate.is_dir():
                continue
            if candidate.name == slug or candidate.name.endswith('-' + slug):
                folder = candidate
                break

        if not folder:
            return

        # Find image files
        exts = {'.jpg', '.jpeg', '.png', '.webp'}
        files = sorted([f for f in folder.iterdir() if f.suffix.lower() in exts])
        if not files:
            return

        # Pick main and subtitle
        main_file = files[0]
        sub_file = files[1] if len(files) > 1 else None

        main_url = f'/images/articles/{folder.name}/{main_file.name}'
        existing['image_main'] = {'url': main_url, 'alt': title_en}
        if sub_file:
            sub_url = f'/images/articles/{folder.name}/{sub_file.name}'
            existing['image_subtitle'] = {'url': sub_url, 'alt': title_en}

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
    await auto_select_hero(${b})
    ensure_final_bodies(${b})

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
for img_type, key in [('main', 'image_main'), ('subtitle', 'image_subtitle')]:
    img_info = imgs.get(key, {})
    src_url = img_info.get('url', '') if isinstance(img_info, dict) else ''
    if not src_url:
        continue
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
conn.execute("UPDATE articles SET status='published', pipeline_stage='published', github_uploaded=1, published_at=datetime('now') WHERE id=?", (${b},))
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
`,e=await function(a,b=3e5){return new Promise(c=>{let d=(0,w.spawn)(`${x}/venv/bin/python3`,["-c",a],{cwd:x,env:{...process.env,PYTHONPATH:x}}),e="",f="";d.stdout.on("data",a=>e+=a.toString()),d.stderr.on("data",a=>f+=a.toString());let g=setTimeout(()=>{d.kill(),c({stdout:e,stderr:f+"\n[TIMEOUT]",code:1})},b);d.on("close",a=>{clearTimeout(g),c({stdout:e,stderr:f,code:a??1})})})}(d),f={};try{let a=e.stdout.trim().split("\n").pop()||"{}";f=JSON.parse(a)}catch{}if(0!==e.code){console.error("publish-local stderr:",e.stderr);let a=f.error||e.stderr||"Python error";return v.NextResponse.json({error:a,ok:!1},{status:400})}try{let a=f;if(!a.ok)return v.NextResponse.json(a,{status:400});return v.NextResponse.json({...a,rebuilding:!1,live:!0})}catch{return v.NextResponse.json({error:"Parse error",raw:e.stdout},{status:500})}}let z=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/publish-local/route",pathname:"/api/publish-local",filename:"route",bundlePath:"app/api/publish-local/route"},distDir:".next_prod_min",relativeProjectDir:"",resolvedPagePath:"/opt/openclaw/workspace/tech-pulse-css/app/api/publish-local/route.ts",nextConfigOutput:"",userland:d}),{workAsyncStorage:A,workUnitAsyncStorage:B,serverHooks:C}=z;function D(){return(0,g.patchFetch)({workAsyncStorage:A,workUnitAsyncStorage:B})}async function E(a,b,c){z.isDev&&(0,h.addRequestMeta)(a,"devRequestTimingInternalsEnd",process.hrtime.bigint());let d="/api/publish-local/route";"/index"===d&&(d="/");let e=await z.prepare(a,b,{srcPage:d,multiZoneDraftMode:!1});if(!e)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:g,params:v,nextConfig:w,parsedUrl:x,isDraftMode:y,prerenderManifest:A,routerServerContext:B,isOnDemandRevalidate:C,revalidateOnlyGenerated:D,resolvedPathname:E,clientReferenceManifest:F,serverActionsManifest:G}=e,H=(0,k.normalizeAppPath)(d),I=!!(A.dynamicRoutes[H]||A.routes[E]),J=async()=>((null==B?void 0:B.render404)?await B.render404(a,b,x,!1):b.end("This page could not be found"),null);if(I&&!y){let a=!!A.routes[E],b=A.dynamicRoutes[H];if(b&&!1===b.fallback&&!a){if(w.experimental.adapterPath)return await J();throw new t.NoFallbackError}}let K=null;!I||z.isDev||y||(K="/index"===(K=E)?"/":K);let L=!0===z.isDev||!I,M=I&&!L;G&&F&&(0,j.setManifestsSingleton)({page:d,clientReferenceManifest:F,serverActionsManifest:G});let N=a.method||"GET",O=(0,i.getTracer)(),P=O.getActiveScopeSpan(),Q={params:v,prerenderManifest:A,renderOpts:{experimental:{authInterrupts:!!w.experimental.authInterrupts},cacheComponents:!!w.cacheComponents,supportsDynamicResponse:L,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:w.cacheLife,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d,e)=>z.onRequestError(a,b,d,e,B)},sharedContext:{buildId:g}},R=new l.NodeNextRequest(a),S=new l.NodeNextResponse(b),T=m.NextRequestAdapter.fromNodeNextRequest(R,(0,m.signalFromNodeResponse)(b));try{let e=async a=>z.handle(T,Q).finally(()=>{if(!a)return;a.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let c=O.getRootSpanAttributes();if(!c)return;if(c.get("next.span_type")!==n.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${c.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=c.get("next.route");if(e){let b=`${N} ${e}`;a.setAttributes({"next.route":e,"http.route":e,"next.span_name":b}),a.updateName(b)}else a.updateName(`${N} ${d}`)}),g=!!(0,h.getRequestMeta)(a,"minimalMode"),j=async h=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!g&&C&&D&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let d=await e(h);a.fetchMetrics=Q.renderOpts.fetchMetrics;let i=Q.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=Q.renderOpts.collectedTags;if(!I)return await (0,p.I)(R,S,d,Q.renderOpts.pendingWaitUntil),null;{let a=await d.blob(),b=(0,q.toNodeOutgoingHttpHeaders)(d.headers);j&&(b[s.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==Q.renderOpts.collectedRevalidate&&!(Q.renderOpts.collectedRevalidate>=s.INFINITE_CACHE)&&Q.renderOpts.collectedRevalidate,e=void 0===Q.renderOpts.collectedExpire||Q.renderOpts.collectedExpire>=s.INFINITE_CACHE?void 0:Q.renderOpts.collectedExpire;return{value:{kind:u.CachedRouteKind.APP_ROUTE,status:d.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:e}}}}catch(b){throw(null==f?void 0:f.isStale)&&await z.onRequestError(a,b,{routerKind:"App Router",routePath:d,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:M,isOnDemandRevalidate:C})},!1,B),b}},l=await z.handleResponse({req:a,nextConfig:w,cacheKey:K,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:A,isRoutePPREnabled:!1,isOnDemandRevalidate:C,revalidateOnlyGenerated:D,responseGenerator:k,waitUntil:c.waitUntil,isMinimalMode:g});if(!I)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==u.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});g||b.setHeader("x-nextjs-cache",C?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),y&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,q.fromNodeOutgoingHttpHeaders)(l.value.headers);return g&&I||m.delete(s.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,r.getCacheControlHeader)(l.cacheControl)),await (0,p.I)(R,S,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};P?await j(P):await O.withPropagatedContext(a.headers,()=>O.trace(n.BaseServerSpan.handleRequest,{spanName:`${N} ${d}`,kind:i.SpanKind.SERVER,attributes:{"http.method":N,"http.target":a.url}},j))}catch(b){if(b instanceof t.NoFallbackError||await z.onRequestError(a,b,{routerKind:"App Router",routePath:H,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:M,isOnDemandRevalidate:C})},!1,B),I)throw b;return await (0,p.I)(R,S,new Response(null,{status:500})),null}}},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},78335:()=>{},79646:a=>{"use strict";a.exports=require("child_process")},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},96487:()=>{}};var b=require("../../../webpack-runtime.js");b.C(a);var c=b.X(0,[445,813],()=>b(b.s=12845));module.exports=c})();