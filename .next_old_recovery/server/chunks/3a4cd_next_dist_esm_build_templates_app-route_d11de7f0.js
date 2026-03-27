module.exports=[101687,e=>{"use strict";var t=e.i(516669),n=e.i(165195),r=e.i(47167),i=e.i(322887),a=e.i(253219),o=e.i(700279),s=e.i(430803),l=e.i(478041),u=e.i(997684),c=e.i(515157),d=e.i(125451),p=e.i(833697),g=e.i(302794),f=e.i(903936),m=e.i(124496),E=e.i(193695);e.i(667545);var R=e.i(631e3),w=e.i(818814),h=e.i(394875),y=e.i(522734),_=e.i(814747);let T="/opt/openclaw/futurepulse/images",x="/opt/openclaw/workspace/tech-pulse-css/public/images/articles",j=[T];function S(e=!1){return new h.default("/opt/openclaw/futurepulse/db/futurepulse.db",{readonly:e})}let N="/tmp/nextjs_build.lock";function b(){return!function(){if(!(0,y.existsSync)(N))return!1;try{let{time:e}=JSON.parse((0,y.readFileSync)(N,"utf8"));if(Date.now()-new Date(e).getTime()>6e5)return(0,y.unlinkSync)(N),!1;return!0}catch{return!1}}()&&((0,y.writeFileSync)(N,JSON.stringify({pid:process.pid,time:new Date().toISOString()})),!0)}let v="/opt/openclaw/workspace/tech-pulse-css/scripts/atomic-build.sh";function A(e,t=50){let n=e.toLowerCase();for(let[e,t]of Object.entries({č:"c",ć:"c",š:"s",ž:"z",đ:"dj",Č:"c",Ć:"c",Š:"s",Ž:"z",Đ:"dj"}))n=n.split(e).join(t);return(n=(n=n.normalize("NFKD").replace(/[^\x00-\x7F]/g,"")).replace(/[^a-z0-9]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")).slice(0,t)}let C="/opt/openclaw/workspace/tech-pulse-css/content";function k(e){if(!e||!(0,y.existsSync)(C))return null;try{for(let t of(0,y.readdirSync)(C)){let n,r=_.default.join(C,t);try{n=(0,y.readdirSync)(r)}catch{continue}for(let t of n){let n=_.default.join(r,t,"index.mdx");if(!(0,y.existsSync)(n)||!(0,y.readFileSync)(n,"utf8").slice(0,2e3).includes(`db_id: ${e}`))continue;let i=t.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/),a=i?i[2]:t;if(!(0,y.existsSync)(x))return{mdxPath:n,imageSlug:a,imageFolder:a};let o=(0,y.readdirSync)(x),s=o.find(e=>e===a);if(s)return{mdxPath:n,imageSlug:a,imageFolder:s};let l=o.find(e=>e===t);if(l)return{mdxPath:n,imageSlug:a,imageFolder:l};let u=o.find(e=>e.endsWith("-"+a)||e===a);if(u)return{mdxPath:n,imageSlug:a,imageFolder:u};return{mdxPath:n,imageSlug:a,imageFolder:a}}}}catch{}return null}function O(e){if(!e||!(0,y.existsSync)(x))return null;let t=A(e),n=(0,y.readdirSync)(x);return n.find(e=>e===t)??n.find(e=>e.endsWith("-"+t))??null}function F(e){let{images:t,folderName:n}=function(e){let t=[],n=new Set,r=e.id,i=(e,r,i,a)=>{n.has(a)||(n.add(a),(0,y.existsSync)(a)&&t.push({id:e,url:r,label:i,osPath:a}))},a=k(r),o=a?.imageFolder??O(e.title_en),s=`art${r}_`;if(o){let e=_.default.join(x,o);try{for(let t of(0,y.readdirSync)(e).sort()){let n,r=_.default.extname(t).toLowerCase();if(![".jpg",".jpeg",".png",".webp"].includes(r))continue;let a=_.default.join(e,t),l=t.toLowerCase();if(l.startsWith("main"))n="✓ Main (aktivan)";else if(l.startsWith("subtitle"))n="✓ Subtitle (aktivan)";else{if(!t.startsWith(s))continue;n=l.includes("_main_")?`Gen Main — ${t}`:l.includes("_sub_")?`Gen Sub — ${t}`:`Gen — ${t}`}let u=`/api/foto-review/img?folder=${encodeURIComponent(o)}&file=${encodeURIComponent(t)}`;i(`pub:${o}/${t}`,u,n,a)}}catch{}}if(r)try{for(let e of(0,y.readdirSync)(T).sort()){if(!e.startsWith(s))continue;let t=_.default.extname(e).toLowerCase();if(![".jpg",".jpeg",".png",".webp"].includes(t))continue;let n=_.default.join(T,e),r=e.toLowerCase(),a=`Gen (legacy) — ${e}`;r.includes("_main_")?a=`Gen Main (legacy) — ${e}`:r.includes("_sub_")&&(a=`Gen Sub (legacy) — ${e}`),i(`gen:${e}`,`/api/foto-review/img?file=${encodeURIComponent(e)}`,a,n)}}catch{}return{images:t,folderName:o??null}}(e);return{id:e.id,title:e.title,title_en:e.title_en,category:e.category,lead:e.lead?e.lead.slice(0,220):"",pipeline_stage:e.pipeline_stage,status:e.status,github_uploaded:e.github_uploaded,created_at:e.created_at,images:t,folderName:n}}async function L(t){let n=new URL(t.url),r=n.searchParams.get("id"),i=n.searchParams.get("log");if(n.searchParams.get("queue"))try{let e=S(!0);e.exec(`CREATE TABLE IF NOT EXISTS task_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT, article_id INTEGER NOT NULL,
        task_type TEXT NOT NULL, model TEXT DEFAULT 'auto',
        status TEXT DEFAULT 'pending', error_msg TEXT,
        created_at TEXT DEFAULT (datetime('now')), done_at TEXT)`);let t=e.prepare("SELECT id, article_id, task_type, model, status, error_msg, created_at, done_at FROM task_queue ORDER BY id DESC LIMIT 80").all(),n=e.prepare("SELECT status, COUNT(*) as n FROM task_queue GROUP BY status").all();return e.close(),w.NextResponse.json({tasks:t,counts:n})}catch(e){return w.NextResponse.json({tasks:[],counts:[],error:e.message})}if(i)try{let{readFileSync:t}=await e.A(323970),n=t("/opt/openclaw/futurepulse/logs/image_regen.log","utf8").split("\n").filter(Boolean),r=Math.min(parseInt(i,10)||40,200);return w.NextResponse.json({lines:n.slice(-r)})}catch{return w.NextResponse.json({lines:[]})}try{let e=S(!0);if(r){let t=e.prepare(`SELECT id, title, title_en, category, lead, pipeline_stage, status,
                  images_json, github_uploaded, created_at
           FROM articles WHERE id = ?`).get(Number(r));if(e.close(),!t)return w.NextResponse.json({error:"Not found"},{status:404});return w.NextResponse.json({article:F(t)})}let t=e.prepare(`SELECT id, title, title_en, category, lead, pipeline_stage, status,
                images_json, github_uploaded, created_at
         FROM articles
         ORDER BY id ASC`).all();return e.close(),w.NextResponse.json({articles:t.map(F),total:t.length})}catch(t){let e=t instanceof Error?t.message:String(t);return w.NextResponse.json({error:e},{status:500})}}async function I(t){try{let n=await t.json(),{action:r,articleId:i}=n;if(!i)return w.NextResponse.json({error:"Missing articleId"},{status:400});let a=S(),o=a.prepare("SELECT id, title, title_en, category, images_json FROM articles WHERE id = ?").get(i);if(!o)return a.close(),w.NextResponse.json({error:"Article not found"},{status:404});if("delete_article"===r){if(!a.prepare("SELECT id, title FROM articles WHERE id = ?").get(i))return a.close(),w.NextResponse.json({error:"Članak ne postoji",ok:!1},{status:404});let t=e.r(522734),n=k(i),r=new Set;try{for(let e of(0,y.readdirSync)(C)){let t,n=_.default.join(C,e);try{t=(0,y.readdirSync)(n)}catch{continue}for(let e of t){let t=_.default.join(n,e);try{(0,y.readdirSync)(t)}catch{continue}for(let e of["index.mdx","index.en.mdx","index.hr.mdx"]){let n=_.default.join(t,e);(0,y.existsSync)(n)&&(0,y.readFileSync)(n,"utf8").slice(0,2e3).includes(`db_id: ${i}`)&&r.add(t)}}}for(let e of r)try{t.rmSync(e,{recursive:!0,force:!0}),console.log(`Deleted MDX folder: ${e}`)}catch(t){console.error(`Failed to delete MDX folder ${e}: ${t}`)}}catch(e){console.error(`Error scanning for MDX files: ${e}`)}if(n?.imageFolder)try{let e=_.default.join(x,n.imageFolder);t.rmSync(e,{recursive:!0,force:!0}),console.log(`Deleted image folder: ${e}`)}catch(e){console.error(`Failed to delete image folder: ${e}`)}a.prepare("DELETE FROM articles WHERE id = ?").run(i),a.close();{let{spawn:t}=await e.A(144264);b()?t("bash",["-c",v],{detached:!0,stdio:"ignore"}).unref():(0,y.writeFileSync)("/tmp/nextjs_rebuild_needed","1")}return w.NextResponse.json({ok:!0,message:`✅ Članak "#${i}" trajno obrisan (MDX + EN/HR verzije + slike + DB)`})}if("delete_image"===r){let{imageId:e}=n;if(!e)return a.close(),w.NextResponse.json({error:"Missing imageId"},{status:400});let t=null;if(e.startsWith("gen:")){let n=e.slice(4);t=j.map(e=>_.default.join(e,n)).find(e=>(0,y.existsSync)(e))??null}else e.startsWith("pub:")&&(t=_.default.join(x,e.slice(4)));if(!t||!(0,y.existsSync)(t))return a.close(),w.NextResponse.json({error:"Slika nije pronađena"},{status:404});try{(0,y.unlinkSync)(t)}catch(e){return a.close(),w.NextResponse.json({error:"Brisanje nije uspjelo"},{status:500})}let r=o.images_json;if(r)try{let e=JSON.parse(r),n=_.default.basename(t),o=!1;e.image_main?.url?.includes(n)&&(delete e.image_main,o=!0),e.image_subtitle?.url?.includes(n)&&(delete e.image_subtitle,o=!0),o&&a.prepare("UPDATE articles SET images_json = ? WHERE id = ?").run(JSON.stringify(e),i)}catch{}return a.close(),w.NextResponse.json({ok:!0,message:"Slika obrisana"})}if("select_images"===r){let t,{heroImageId:r,subtitleImageId:s}=n,l=e=>{if(!e)return null;if(e.startsWith("gen:")){let t=e.slice(4);return j.map(e=>_.default.join(e,t)).find(e=>(0,y.existsSync)(e))??null}return e.startsWith("pub:")?_.default.join(x,e.slice(4)):null},u=l(r);if(!u||!(0,y.existsSync)(u))return a.close(),w.NextResponse.json({error:"Hero slika nije pronađena"},{status:400});let c=s?l(s):null,d=k(i);if(d?.imageFolder)t=d.imageFolder;else{let e=A(o.title_en||o.title);t=O(o.title_en)??e}let p=_.default.join(x,t);(0,y.mkdirSync)(p,{recursive:!0});let g=_.default.extname(u).toLowerCase()||".jpg",f=_.default.join(p,`main${g}`);u!==f&&(0,y.copyFileSync)(u,f);let m=null;if(c&&(0,y.existsSync)(c)){let e=_.default.extname(c).toLowerCase()||".jpg";m=_.default.join(p,`subtitle${e}`),c!==m&&(0,y.copyFileSync)(c,m)}let E={},R={};try{let e=JSON.parse(o.images_json||"{}");E=e.image_main||{},R=e.image_subtitle||{}}catch{}let h=`/images/articles/${t}/main${g}`,T=m?`/images/articles/${t}/subtitle${_.default.extname(m).toLowerCase()||".jpg"}`:null,S={image_main:{...E,url:h},success:!0};T?S.image_subtitle={...R,url:T}:R.url&&(S.image_subtitle=R),a.prepare("UPDATE articles SET images_json = ? WHERE id = ?").run(JSON.stringify(S),i),a.close(),function(e,t,n){let r=k(e),i=r?.mdxPath,a=(r,i=!0)=>{if(!(0,y.existsSync)(r))return!1;let a=(0,y.readFileSync)(r,"utf8");return(!i||!!a.includes(`db_id: ${e}`))&&(a=a.replace(/^(image:\n\s+url:\s*)"[^"]*"/m,`$1"${t}"`),n&&/^subtitleImage:/m.test(a)&&(a=a.replace(/^(subtitleImage:\n\s+url:\s*)"[^"]*"/m,`$1"${n}"`)),(0,y.writeFileSync)(r,a,"utf8"),!0)};try{if(i&&a(i,!0)){let e=_.default.join(_.default.dirname(i),"index.hr.mdx");return(0,y.existsSync)(e)&&a(e,!1),!0}let e=_.default.join(process.cwd(),"content");for(let t of(0,y.readdirSync)(e)){let n,r=_.default.join(e,t);try{n=(0,y.readdirSync)(r)}catch{continue}for(let e of n){let t=_.default.join(r,e,"index.mdx");if(a(t,!0)){let t=_.default.join(r,e,"index.hr.mdx");return(0,y.existsSync)(t)&&a(t,!1),!0}}}}catch(e){console.error("updateMdxImages error:",e)}}(i,h,T);let{spawn:N}=await e.A(144264);if(!b())return w.NextResponse.json({ok:!0,message:`⏳ Build već u tijeku — čekaj ~2min prije nego što pokušaš ponovno`,building:!0});return N("bash",["-c",v],{detached:!0,stdio:"ignore"}).unref(),w.NextResponse.json({ok:!0,message:`✓ Slike snimljene u ${t} — rebuild pokrenut (~2min)`})}if("regen_endings"===r){let{spawn:t}=await e.A(144264),n=`
import sys, asyncio
sys.path.insert(0, '.')
import logging
logging.basicConfig(filename='logs/foto_review.log', level=logging.INFO)
from agents.hr_lang_agent import HRLangAgent
agent = HRLangAgent()
asyncio.run(agent.rewrite_single(${i}))
`;return a.close(),t("/opt/openclaw/futurepulse/venv/bin/python3",["-c",n],{cwd:"/opt/openclaw/futurepulse",detached:!0,stdio:"ignore"}).unref(),w.NextResponse.json({ok:!0,message:"Regeneracija završetaka pokrenuta (~30s)"})}if("write_en"===r){let{spawn:t}=await e.A(144264),n=`
import sys, asyncio, sqlite3
sys.path.insert(0, '.')
import logging
logging.basicConfig(filename='logs/foto_review.log', level=logging.INFO)
from agents.writer import ArticleWriter

async def run():
    conn = sqlite3.connect('db/futurepulse.db')
    conn.row_factory = sqlite3.Row
    row = conn.execute('SELECT * FROM articles WHERE id=?', (${i},)).fetchone()
    conn.close()
    if not row:
        print('Article not found')
        return
    item = {
        'title': row['title_en'] or row['title'] or '',
        'snippet': (row['part1'] or row['body_md'] or '')[:600],
        'source_name': row['source_name'] or '',
        'category': row['category'] or 'tech',
    }
    writer = ArticleWriter()
    ok = await writer.write_article_en(${i}, item, [])
    print('EN write OK' if ok else 'EN write FAILED')

asyncio.run(run())
`;return a.close(),t("/opt/openclaw/futurepulse/venv/bin/python3",["-c",n],{cwd:"/opt/openclaw/futurepulse",detached:!0,stdio:"ignore"}).unref(),w.NextResponse.json({ok:!0,message:"Pisanje EN verzije pokrenuto (~30s)"})}if("write_hr"===r){let{spawn:t}=await e.A(144264),n=`
import sys, asyncio, sqlite3, json
sys.path.insert(0, '.')
import logging
logging.basicConfig(filename='logs/foto_review.log', level=logging.INFO)
from agents.hr_lang_agent import HRLangAgent

async def run():
    conn = sqlite3.connect('db/futurepulse.db')
    conn.row_factory = sqlite3.Row
    row = conn.execute('SELECT * FROM articles WHERE id=?', (${i},)).fetchone()
    if not row:
        conn.close()
        print('Article not found')
        return
    body = row['body_md'] or ''
    part1 = row['part1'] or ''
    part2 = row['part2'] or ''
    if not part1 and body:
        paras = [p for p in body.split('\\n\\n') if p.strip()]
        half = max(1, len(paras) // 2)
        part1 = '\\n\\n'.join(paras[:half])
        part2 = '\\n\\n'.join(paras[half:])
    try:
        endings = json.loads(row['endings_json'] or '{}')
    except Exception:
        endings = {}
    article = {
        'id': ${i},
        'title': row['title'] or row['title_en'] or '',
        'subtitle': row['subtitle'] or row['subtitle_en'] or '',
        'part1': part1,
        'part2': part2,
        'endings': endings,
        'category': row['category'] or 'tech',
    }
    agent = HRLangAgent()
    article, _ = await agent.run_structure_stage(article)
    article, _ = await agent.run_language_stage(article)
    conn.execute("""
        UPDATE articles SET title=?, subtitle=?, part1=?, part2=?, endings_json=?
        WHERE id=?
    """, (
        article.get('title') or row['title'],
        article.get('subtitle') or row['subtitle'],
        article.get('part1', ''),
        article.get('part2', ''),
        json.dumps(article.get('endings', endings)),
        ${i}
    ))
    conn.commit()
    conn.close()
    print(f'HR write OK for #{${i}}')

asyncio.run(run())
`;return a.close(),t("/opt/openclaw/futurepulse/venv/bin/python3",["-c",n],{cwd:"/opt/openclaw/futurepulse",detached:!0,stdio:"ignore"}).unref(),w.NextResponse.json({ok:!0,message:"Pisanje HR verzije pokrenuto (~45s)"})}if("queue_add"===r){let{taskType:t,model:r}=n;if(!t)return a.close(),w.NextResponse.json({error:"Missing taskType"},{status:400});a.exec(`CREATE TABLE IF NOT EXISTS task_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT, article_id INTEGER NOT NULL,
        task_type TEXT NOT NULL, model TEXT DEFAULT 'auto',
        status TEXT DEFAULT 'pending', error_msg TEXT,
        created_at TEXT DEFAULT (datetime('now')), done_at TEXT)`),a.prepare("INSERT INTO task_queue (article_id, task_type, model) VALUES (?, ?, ?)").run(i,t,r||"auto"),a.close();let{spawn:o}=await e.A(144264);return o("/opt/openclaw/futurepulse/venv/bin/python3",["queue_runner.py"],{cwd:"/opt/openclaw/futurepulse",detached:!0,stdio:"ignore"}).unref(),w.NextResponse.json({ok:!0,message:"Dodano u queue"})}if("queue_clear"===r){a.exec(`CREATE TABLE IF NOT EXISTS task_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT, article_id INTEGER NOT NULL,
        task_type TEXT NOT NULL, model TEXT DEFAULT 'auto',
        status TEXT DEFAULT 'pending', error_msg TEXT,
        created_at TEXT DEFAULT (datetime('now')), done_at TEXT)`);let e=a.prepare("DELETE FROM task_queue WHERE status IN ('done', 'error')").run();return a.close(),w.NextResponse.json({ok:!0,deleted:e.changes})}return a.close(),w.NextResponse.json({error:"Unknown action"},{status:400})}catch(t){let e=t instanceof Error?t.message:String(t);return w.NextResponse.json({error:e},{status:500})}}e.s(["GET",()=>L,"POST",()=>I],8772);var $=e.i(8772);let U=new t.AppRouteRouteModule({definition:{kind:n.RouteKind.APP_ROUTE,page:"/api/foto-review/route",pathname:"/api/foto-review",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/openclaw/workspace/tech-pulse-css/app/api/foto-review/route.ts",nextConfigOutput:"",userland:$}),{workAsyncStorage:D,workUnitAsyncStorage:M,serverHooks:P}=U;function H(){return(0,r.patchFetch)({workAsyncStorage:D,workUnitAsyncStorage:M})}async function q(e,t,r){U.isDev&&(0,i.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let w="/api/foto-review/route";w=w.replace(/\/index$/,"")||"/";let h=await U.prepare(e,t,{srcPage:w,multiZoneDraftMode:!1});if(!h)return t.statusCode=400,t.end("Bad Request"),null==r.waitUntil||r.waitUntil.call(r,Promise.resolve()),null;let{buildId:y,params:_,nextConfig:T,parsedUrl:x,isDraftMode:j,prerenderManifest:S,routerServerContext:N,isOnDemandRevalidate:b,revalidateOnlyGenerated:v,resolvedPathname:A,clientReferenceManifest:C,serverActionsManifest:k}=h,O=(0,s.normalizeAppPath)(w),F=!!(S.dynamicRoutes[O]||S.routes[A]),L=async()=>((null==N?void 0:N.render404)?await N.render404(e,t,x,!1):t.end("This page could not be found"),null);if(F&&!j){let e=!!S.routes[A],t=S.dynamicRoutes[O];if(t&&!1===t.fallback&&!e){if(T.experimental.adapterPath)return await L();throw new E.NoFallbackError}}let I=null;!F||U.isDev||j||(I="/index"===(I=A)?"/":I);let $=!0===U.isDev||!F,D=F&&!$;k&&C&&(0,o.setManifestsSingleton)({page:w,clientReferenceManifest:C,serverActionsManifest:k});let M=e.method||"GET",P=(0,a.getTracer)(),H=P.getActiveScopeSpan(),q={params:_,prerenderManifest:S,renderOpts:{experimental:{authInterrupts:!!T.experimental.authInterrupts},cacheComponents:!!T.cacheComponents,supportsDynamicResponse:$,incrementalCache:(0,i.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:T.cacheLife,waitUntil:r.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,n,r,i)=>U.onRequestError(e,t,r,i,N)},sharedContext:{buildId:y}},X=new l.NodeNextRequest(e),W=new l.NodeNextResponse(t),G=u.NextRequestAdapter.fromNodeNextRequest(X,(0,u.signalFromNodeResponse)(t));try{let o=async e=>U.handle(G,q).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let n=P.getRootSpanAttributes();if(!n)return;if(n.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${n.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let r=n.get("next.route");if(r){let t=`${M} ${r}`;e.setAttributes({"next.route":r,"http.route":r,"next.span_name":t}),e.updateName(t)}else e.updateName(`${M} ${w}`)}),s=!!(0,i.getRequestMeta)(e,"minimalMode"),l=async i=>{var a,l;let u=async({previousCacheEntry:n})=>{try{if(!s&&b&&v&&!n)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let a=await o(i);e.fetchMetrics=q.renderOpts.fetchMetrics;let l=q.renderOpts.pendingWaitUntil;l&&r.waitUntil&&(r.waitUntil(l),l=void 0);let u=q.renderOpts.collectedTags;if(!F)return await (0,p.sendResponse)(X,W,a,q.renderOpts.pendingWaitUntil),null;{let e=await a.blob(),t=(0,g.toNodeOutgoingHttpHeaders)(a.headers);u&&(t[m.NEXT_CACHE_TAGS_HEADER]=u),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let n=void 0!==q.renderOpts.collectedRevalidate&&!(q.renderOpts.collectedRevalidate>=m.INFINITE_CACHE)&&q.renderOpts.collectedRevalidate,r=void 0===q.renderOpts.collectedExpire||q.renderOpts.collectedExpire>=m.INFINITE_CACHE?void 0:q.renderOpts.collectedExpire;return{value:{kind:R.CachedRouteKind.APP_ROUTE,status:a.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:n,expire:r}}}}catch(t){throw(null==n?void 0:n.isStale)&&await U.onRequestError(e,t,{routerKind:"App Router",routePath:w,routeType:"route",revalidateReason:(0,d.getRevalidateReason)({isStaticGeneration:D,isOnDemandRevalidate:b})},!1,N),t}},c=await U.handleResponse({req:e,nextConfig:T,cacheKey:I,routeKind:n.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:S,isRoutePPREnabled:!1,isOnDemandRevalidate:b,revalidateOnlyGenerated:v,responseGenerator:u,waitUntil:r.waitUntil,isMinimalMode:s});if(!F)return null;if((null==c||null==(a=c.value)?void 0:a.kind)!==R.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==c||null==(l=c.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});s||t.setHeader("x-nextjs-cache",b?"REVALIDATED":c.isMiss?"MISS":c.isStale?"STALE":"HIT"),j&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let E=(0,g.fromNodeOutgoingHttpHeaders)(c.value.headers);return s&&F||E.delete(m.NEXT_CACHE_TAGS_HEADER),!c.cacheControl||t.getHeader("Cache-Control")||E.get("Cache-Control")||E.set("Cache-Control",(0,f.getCacheControlHeader)(c.cacheControl)),await (0,p.sendResponse)(X,W,new Response(c.value.body,{headers:E,status:c.value.status||200})),null};H?await l(H):await P.withPropagatedContext(e.headers,()=>P.trace(c.BaseServerSpan.handleRequest,{spanName:`${M} ${w}`,kind:a.SpanKind.SERVER,attributes:{"http.method":M,"http.target":e.url}},l))}catch(t){if(t instanceof E.NoFallbackError||await U.onRequestError(e,t,{routerKind:"App Router",routePath:O,routeType:"route",revalidateReason:(0,d.getRevalidateReason)({isStaticGeneration:D,isOnDemandRevalidate:b})},!1,N),F)throw t;return await (0,p.sendResponse)(X,W,new Response(null,{status:500})),null}}e.s(["handler",()=>q,"patchFetch",()=>H,"routeModule",()=>U,"serverHooks",()=>P,"workAsyncStorage",()=>D,"workUnitAsyncStorage",()=>M],101687)}];

//# sourceMappingURL=3a4cd_next_dist_esm_build_templates_app-route_d11de7f0.js.map