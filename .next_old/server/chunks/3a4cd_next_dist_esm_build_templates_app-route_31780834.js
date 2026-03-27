module.exports=[524494,e=>{"use strict";var t=e.i(516669),r=e.i(165195),i=e.i(47167),n=e.i(322887),a=e.i(253219),o=e.i(700279),s=e.i(430803),l=e.i(478041),c=e.i(997684),d=e.i(515157),u=e.i(125451),p=e.i(833697),_=e.i(302794),g=e.i(903936),m=e.i(124496),f=e.i(193695);e.i(667545);var h=e.i(631e3),x=e.i(818814),E=e.i(233405);let b="/opt/openclaw/futurepulse";async function w(t){let{articleId:r,chosen_ending:i}=await t.json();if(!r)return x.NextResponse.json({error:"Missing articleId"},{status:400});let n=`
import sys, json, asyncio, logging
sys.path.insert(0, '${b}')
logging.basicConfig(level=logging.WARNING)

from core.db import Database
from core.github_uploader import convert_to_mdx, convert_to_mdx_hr, _parse_images_json
import shutil
from pathlib import Path

WORKSPACE = Path('/opt/openclaw/workspace/tech-pulse-css')
CONTENT_DIR = WORKSPACE / 'content'
PUBLIC_IMAGES = WORKSPACE / 'public' / 'images' / 'articles'
FP_IMAGES = Path('${b}/images')

CHOSEN_ENDING = ${i?JSON.stringify(i):"None"}

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
    """, (${r},)).fetchone()
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
    conn.execute("UPDATE articles SET chosen_ending=? WHERE id=?", (CHOSEN_ENDING, ${r}))
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
        ok = await writer.write_article_en(${r}, item, [])
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
        pull_result = await puller.pull(${r})
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
            (${r},)
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

async def main():
    en_ok = await ensure_en(article)
    if not en_ok:
        # already printed error
        return

    imgs_ok = await ensure_images(article)
    # Non-fatal if images fail — publish anyway

    # Auto-select hero image if images_json has no image_main yet
    await auto_select_hero(${r})

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
conn.execute("UPDATE articles SET status='published', pipeline_stage='published', github_uploaded=1, published_at=datetime('now') WHERE id=?", (${r},))
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
`,a=await function(e,t=3e5){return new Promise(r=>{let i=(0,E.spawn)(`${b}/venv/bin/python3`,["-c",e],{cwd:b,env:{...process.env,PYTHONPATH:b}}),n="",a="";i.stdout.on("data",e=>n+=e.toString()),i.stderr.on("data",e=>a+=e.toString());let o=setTimeout(()=>{i.kill(),r({stdout:n,stderr:a+"\n[TIMEOUT]",code:1})},t);i.on("close",e=>{clearTimeout(o),r({stdout:n,stderr:a,code:e??1})})})}(n),o={};try{let e=a.stdout.trim().split("\n").pop()||"{}";o=JSON.parse(e)}catch{}if(0!==a.code){console.error("publish-local stderr:",a.stderr);let e=o.error||a.stderr||"Python error";return x.NextResponse.json({error:e,ok:!1},{status:400})}try{let t=o;if(!t.ok)return x.NextResponse.json(t,{status:400});let{existsSync:r,readFileSync:i,writeFileSync:n,unlinkSync:a}=e.r(522734),s="/tmp/nextjs_build.lock";if(function(){if(!r(s))return!1;try{let{time:e}=JSON.parse(i(s,"utf8"));if(Date.now()-new Date(e).getTime()>6e5){try{a(s)}catch{}return!1}return!0}catch{return!1}}())return n("/tmp/nextjs_rebuild_needed","1"),x.NextResponse.json({...t,rebuilding:!0,building:!0});return n(s,JSON.stringify({pid:process.pid,time:new Date().toISOString()})),(0,E.spawn)("bash",["-c","/opt/openclaw/workspace/tech-pulse-css/scripts/atomic-build.sh"],{detached:!0,stdio:"ignore"}).unref(),x.NextResponse.json({...t,rebuilding:!0})}catch{return x.NextResponse.json({error:"Parse error",raw:a.stdout},{status:500})}}e.s(["POST",()=>w],387770);var y=e.i(387770);let R=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/publish-local/route",pathname:"/api/publish-local",filename:"route",bundlePath:""},distDir:".next_building",relativeProjectDir:"",resolvedPagePath:"[project]/openclaw/workspace/tech-pulse-css/app/api/publish-local/route.ts",nextConfigOutput:"",userland:y}),{workAsyncStorage:v,workUnitAsyncStorage:N,serverHooks:C}=R;function S(){return(0,i.patchFetch)({workAsyncStorage:v,workUnitAsyncStorage:N})}async function k(e,t,i){R.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let x="/api/publish-local/route";x=x.replace(/\/index$/,"")||"/";let E=await R.prepare(e,t,{srcPage:x,multiZoneDraftMode:!1});if(!E)return t.statusCode=400,t.end("Bad Request"),null==i.waitUntil||i.waitUntil.call(i,Promise.resolve()),null;let{buildId:b,params:w,nextConfig:y,parsedUrl:v,isDraftMode:N,prerenderManifest:C,routerServerContext:S,isOnDemandRevalidate:k,revalidateOnlyGenerated:T,resolvedPathname:A,clientReferenceManifest:P,serverActionsManifest:O}=E,j=(0,s.normalizeAppPath)(x),I=!!(C.dynamicRoutes[j]||C.routes[A]),D=async()=>((null==S?void 0:S.render404)?await S.render404(e,t,v,!1):t.end("This page could not be found"),null);if(I&&!N){let e=!!C.routes[A],t=C.dynamicRoutes[j];if(t&&!1===t.fallback&&!e){if(y.experimental.adapterPath)return await D();throw new f.NoFallbackError}}let H=null;!I||R.isDev||N||(H="/index"===(H=A)?"/":H);let F=!0===R.isDev||!I,M=I&&!F;O&&P&&(0,o.setManifestsSingleton)({page:x,clientReferenceManifest:P,serverActionsManifest:O});let U=e.method||"GET",W=(0,a.getTracer)(),$=W.getActiveScopeSpan(),G={params:w,prerenderManifest:C,renderOpts:{experimental:{authInterrupts:!!y.experimental.authInterrupts},cacheComponents:!!y.cacheComponents,supportsDynamicResponse:F,incrementalCache:(0,n.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:y.cacheLife,waitUntil:i.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,i,n)=>R.onRequestError(e,t,i,n,S)},sharedContext:{buildId:b}},K=new l.NodeNextRequest(e),q=new l.NodeNextResponse(t),B=c.NextRequestAdapter.fromNodeNextRequest(K,(0,c.signalFromNodeResponse)(t));try{let o=async e=>R.handle(B,G).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=W.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let i=r.get("next.route");if(i){let t=`${U} ${i}`;e.setAttributes({"next.route":i,"http.route":i,"next.span_name":t}),e.updateName(t)}else e.updateName(`${U} ${x}`)}),s=!!(0,n.getRequestMeta)(e,"minimalMode"),l=async n=>{var a,l;let c=async({previousCacheEntry:r})=>{try{if(!s&&k&&T&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let a=await o(n);e.fetchMetrics=G.renderOpts.fetchMetrics;let l=G.renderOpts.pendingWaitUntil;l&&i.waitUntil&&(i.waitUntil(l),l=void 0);let c=G.renderOpts.collectedTags;if(!I)return await (0,p.sendResponse)(K,q,a,G.renderOpts.pendingWaitUntil),null;{let e=await a.blob(),t=(0,_.toNodeOutgoingHttpHeaders)(a.headers);c&&(t[m.NEXT_CACHE_TAGS_HEADER]=c),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==G.renderOpts.collectedRevalidate&&!(G.renderOpts.collectedRevalidate>=m.INFINITE_CACHE)&&G.renderOpts.collectedRevalidate,i=void 0===G.renderOpts.collectedExpire||G.renderOpts.collectedExpire>=m.INFINITE_CACHE?void 0:G.renderOpts.collectedExpire;return{value:{kind:h.CachedRouteKind.APP_ROUTE,status:a.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:i}}}}catch(t){throw(null==r?void 0:r.isStale)&&await R.onRequestError(e,t,{routerKind:"App Router",routePath:x,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:M,isOnDemandRevalidate:k})},!1,S),t}},d=await R.handleResponse({req:e,nextConfig:y,cacheKey:H,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:C,isRoutePPREnabled:!1,isOnDemandRevalidate:k,revalidateOnlyGenerated:T,responseGenerator:c,waitUntil:i.waitUntil,isMinimalMode:s});if(!I)return null;if((null==d||null==(a=d.value)?void 0:a.kind)!==h.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(l=d.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});s||t.setHeader("x-nextjs-cache",k?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),N&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let f=(0,_.fromNodeOutgoingHttpHeaders)(d.value.headers);return s&&I||f.delete(m.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||f.get("Cache-Control")||f.set("Cache-Control",(0,g.getCacheControlHeader)(d.cacheControl)),await (0,p.sendResponse)(K,q,new Response(d.value.body,{headers:f,status:d.value.status||200})),null};$?await l($):await W.withPropagatedContext(e.headers,()=>W.trace(d.BaseServerSpan.handleRequest,{spanName:`${U} ${x}`,kind:a.SpanKind.SERVER,attributes:{"http.method":U,"http.target":e.url}},l))}catch(t){if(t instanceof f.NoFallbackError||await R.onRequestError(e,t,{routerKind:"App Router",routePath:j,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:M,isOnDemandRevalidate:k})},!1,S),I)throw t;return await (0,p.sendResponse)(K,q,new Response(null,{status:500})),null}}e.s(["handler",()=>k,"patchFetch",()=>S,"routeModule",()=>R,"serverHooks",()=>C,"workAsyncStorage",()=>v,"workUnitAsyncStorage",()=>N],524494)}];

//# sourceMappingURL=3a4cd_next_dist_esm_build_templates_app-route_31780834.js.map