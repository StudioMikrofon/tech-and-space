module.exports=[193695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},270406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},918622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},324725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},814747,(e,t,r)=>{t.exports=e.x("path",()=>require("path"))},522734,(e,t,r)=>{t.exports=e.x("fs",()=>require("fs"))},233405,(e,t,r)=>{t.exports=e.x("child_process",()=>require("child_process"))},924868,(e,t,r)=>{t.exports=e.x("fs/promises",()=>require("fs/promises"))},891810,e=>{"use strict";var t=e.i(516669),r=e.i(165195),n=e.i(47167),a=e.i(322887),i=e.i(253219),s=e.i(700279),o=e.i(430803),l=e.i(478041),d=e.i(997684),p=e.i(515157),u=e.i(125451),c=e.i(833697),m=e.i(302794),f=e.i(903936),x=e.i(124496),g=e.i(193695);e.i(667545);var h=e.i(631e3),w=e.i(818814),R=e.i(924868),b=e.i(522734),v=e.i(814747),y=e.i(233405);let E="/opt/openclaw/workspace/tech-pulse-css",_="/opt/openclaw/futurepulse";async function $(t){var r,n,a,i,s,o;let l,d,p,u,c;if((t.headers.get("content-type")||"").includes("multipart/form-data")){let e=await t.formData();l=Number(e.get("articleId")),d=e.get("imageType")||"main",c=e.get("alt")||"";let r=e.get("file");if(!r)return w.NextResponse.json({error:"No file"},{status:400});let n=await r.arrayBuffer();p=Buffer.from(n);let a=r.type;u="image/png"===a?".png":"image/webp"===a?".webp":".jpg"}else{let e=await t.json();l=Number(e.articleId),d=e.imageType||"main",c=e.alt||"";let r=e.imageUrl;if(!r)return w.NextResponse.json({error:"No imageUrl"},{status:400});let n=await fetch(r,{headers:{"User-Agent":"Mozilla/5.0"}});if(!n.ok)return w.NextResponse.json({error:`Fetch failed: ${n.status}`},{status:400});let a=await n.arrayBuffer();p=Buffer.from(a);let i=n.headers.get("content-type")||"";u=i.includes("png")?".png":i.includes("webp")?".webp":".jpg"}if(!l||isNaN(l))return w.NextResponse.json({error:"Invalid articleId"},{status:400});let m=`
import sys, sqlite3
conn = sqlite3.connect('${_}/db/futurepulse.db')
row = conn.execute('SELECT title_en, title FROM articles WHERE id=${l}').fetchone()
conn.close()
if not row: sys.exit(1)
import re
title = (row[0] or row[1] or '').lower()
char_map = {'č':'c','ć':'c','š':'s','ž':'z','đ':'dj'}
for s,d in char_map.items(): title = title.replace(s,d)
title = title.encode('ascii','ignore').decode()
slug = re.sub(r'[^a-z0-9]+','-',title).strip('-')[:50]
print(slug)
`,f=await new Promise(e=>{let t="",r=(0,y.spawn)(`${_}/venv/bin/python3`,["-c",m]);r.stdout.on("data",e=>t+=e.toString()),r.on("close",()=>e(t.trim()))});if(!f)return w.NextResponse.json({error:"Article not found"},{status:404});let x=v.default.join(E,"public","images","articles",f);(0,b.existsSync)(x)||await (0,R.mkdir)(x,{recursive:!0});let g="main"===d?`main${u}`:`subtitle${u}`,h=v.default.join(x,g);await (0,R.writeFile)(h,p);let $=`/images/articles/${f}/${g}`;return await (r=l,n=d,a=c||f,new Promise(e=>{let t=`
import sys, json
sys.path.insert(0, '${_}')
from core.db import Database
db = Database()
conn = db.get_conn()
row = conn.execute('SELECT images_json FROM articles WHERE id=?', (${r},)).fetchone()
raw = row[0] if row else '{}'
try:
    imgs = json.loads(raw or '{}')
except:
    imgs = {}
imgs['${"main"===n?"image_main":"image_subtitle"}'] = {'url': '${$}', 'alt': '${a}'}
conn.execute('UPDATE articles SET images_json=? WHERE id=?', (json.dumps(imgs), ${r}))
conn.commit()
conn.close()
print('ok')
`;(0,y.spawn)(`${_}/venv/bin/python3`,["-c",t],{cwd:_}).on("close",()=>e())})),await (i=l,s=d,o=c||f,new Promise(e=>{let t="main"===s?"image":"subtitleImage",r=`
import sys, re
sys.path.insert(0, '${_}')
import sqlite3
conn = sqlite3.connect('${_}/db/futurepulse.db')
row = conn.execute('SELECT title_en, category FROM articles WHERE id=?', (${i},)).fetchone()
conn.close()
if not row: sys.exit(0)

import pathlib, glob
content_dir = pathlib.Path('${E}/content')
for mdx in content_dir.rglob('index.mdx'):
    text = mdx.read_text(encoding='utf-8')
    if 'db_id: ${i}' not in text:
        continue
    fm_end = text.index('\\n---\\n', 4) + 5
    fm = text[4:fm_end-4]
    body = text[fm_end:]

    if '${t}:' in fm:
        fm = re.sub(
            r'${t}:\\s*\\n(?:  .*\\n)*',
            '${t}:\\n  url: "${$}"\\n  alt: "${o}"\\n',
            fm
        )
    else:
        fm = fm.rstrip() + '\\n${t}:\\n  url: "${$}"\\n  alt: "${o}"\\n'

    mdx.write_text('---\\n' + fm + '---\\n' + body, encoding='utf-8')
    print('updated:', str(mdx))
    break
`;(0,y.spawn)(`${_}/venv/bin/python3`,["-c",r],{cwd:_}).on("close",()=>e())})),!function(){let t=`${E}/scripts/atomic-build.sh`,r="/tmp/nextjs_build.lock",{existsSync:n,readFileSync:a,writeFileSync:i}=e.r(522734);if(n(r))try{let{time:e}=JSON.parse(a(r,"utf8"));if(Date.now()-new Date(e).getTime()<=6e5)return void i("/tmp/nextjs_rebuild_needed","1")}catch{}i(r,JSON.stringify({pid:process.pid,time:new Date().toISOString()})),(0,y.spawn)("bash",["-c",t],{detached:!0,stdio:"ignore"}).unref()}(),w.NextResponse.json({ok:!0,url:$})}e.s(["POST",()=>$],584838);var C=e.i(584838);let N=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/upload-image/route",pathname:"/api/upload-image",filename:"route",bundlePath:""},distDir:".next_building",relativeProjectDir:"",resolvedPagePath:"[project]/openclaw/workspace/tech-pulse-css/app/api/upload-image/route.ts",nextConfigOutput:"",userland:C}),{workAsyncStorage:j,workUnitAsyncStorage:S,serverHooks:T}=N;function A(){return(0,n.patchFetch)({workAsyncStorage:j,workUnitAsyncStorage:S})}async function k(e,t,n){N.isDev&&(0,a.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let w="/api/upload-image/route";w=w.replace(/\/index$/,"")||"/";let R=await N.prepare(e,t,{srcPage:w,multiZoneDraftMode:!1});if(!R)return t.statusCode=400,t.end("Bad Request"),null==n.waitUntil||n.waitUntil.call(n,Promise.resolve()),null;let{buildId:b,params:v,nextConfig:y,parsedUrl:E,isDraftMode:_,prerenderManifest:$,routerServerContext:C,isOnDemandRevalidate:j,revalidateOnlyGenerated:S,resolvedPathname:T,clientReferenceManifest:A,serverActionsManifest:k}=R,P=(0,o.normalizeAppPath)(w),q=!!($.dynamicRoutes[P]||$.routes[T]),O=async()=>((null==C?void 0:C.render404)?await C.render404(e,t,E,!1):t.end("This page could not be found"),null);if(q&&!_){let e=!!$.routes[T],t=$.dynamicRoutes[P];if(t&&!1===t.fallback&&!e){if(y.experimental.adapterPath)return await O();throw new g.NoFallbackError}}let H=null;!q||N.isDev||_||(H="/index"===(H=T)?"/":H);let I=!0===N.isDev||!q,D=q&&!I;k&&A&&(0,s.setManifestsSingleton)({page:w,clientReferenceManifest:A,serverActionsManifest:k});let U=e.method||"GET",M=(0,i.getTracer)(),F=M.getActiveScopeSpan(),B={params:v,prerenderManifest:$,renderOpts:{experimental:{authInterrupts:!!y.experimental.authInterrupts},cacheComponents:!!y.cacheComponents,supportsDynamicResponse:I,incrementalCache:(0,a.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:y.cacheLife,waitUntil:n.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,n,a)=>N.onRequestError(e,t,n,a,C)},sharedContext:{buildId:b}},K=new l.NodeNextRequest(e),L=new l.NodeNextResponse(t),W=d.NextRequestAdapter.fromNodeNextRequest(K,(0,d.signalFromNodeResponse)(t));try{let s=async e=>N.handle(W,B).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=M.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==p.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let n=r.get("next.route");if(n){let t=`${U} ${n}`;e.setAttributes({"next.route":n,"http.route":n,"next.span_name":t}),e.updateName(t)}else e.updateName(`${U} ${w}`)}),o=!!(0,a.getRequestMeta)(e,"minimalMode"),l=async a=>{var i,l;let d=async({previousCacheEntry:r})=>{try{if(!o&&j&&S&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let i=await s(a);e.fetchMetrics=B.renderOpts.fetchMetrics;let l=B.renderOpts.pendingWaitUntil;l&&n.waitUntil&&(n.waitUntil(l),l=void 0);let d=B.renderOpts.collectedTags;if(!q)return await (0,c.sendResponse)(K,L,i,B.renderOpts.pendingWaitUntil),null;{let e=await i.blob(),t=(0,m.toNodeOutgoingHttpHeaders)(i.headers);d&&(t[x.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==B.renderOpts.collectedRevalidate&&!(B.renderOpts.collectedRevalidate>=x.INFINITE_CACHE)&&B.renderOpts.collectedRevalidate,n=void 0===B.renderOpts.collectedExpire||B.renderOpts.collectedExpire>=x.INFINITE_CACHE?void 0:B.renderOpts.collectedExpire;return{value:{kind:h.CachedRouteKind.APP_ROUTE,status:i.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:n}}}}catch(t){throw(null==r?void 0:r.isStale)&&await N.onRequestError(e,t,{routerKind:"App Router",routePath:w,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:D,isOnDemandRevalidate:j})},!1,C),t}},p=await N.handleResponse({req:e,nextConfig:y,cacheKey:H,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:$,isRoutePPREnabled:!1,isOnDemandRevalidate:j,revalidateOnlyGenerated:S,responseGenerator:d,waitUntil:n.waitUntil,isMinimalMode:o});if(!q)return null;if((null==p||null==(i=p.value)?void 0:i.kind)!==h.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==p||null==(l=p.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});o||t.setHeader("x-nextjs-cache",j?"REVALIDATED":p.isMiss?"MISS":p.isStale?"STALE":"HIT"),_&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let g=(0,m.fromNodeOutgoingHttpHeaders)(p.value.headers);return o&&q||g.delete(x.NEXT_CACHE_TAGS_HEADER),!p.cacheControl||t.getHeader("Cache-Control")||g.get("Cache-Control")||g.set("Cache-Control",(0,f.getCacheControlHeader)(p.cacheControl)),await (0,c.sendResponse)(K,L,new Response(p.value.body,{headers:g,status:p.value.status||200})),null};F?await l(F):await M.withPropagatedContext(e.headers,()=>M.trace(p.BaseServerSpan.handleRequest,{spanName:`${U} ${w}`,kind:i.SpanKind.SERVER,attributes:{"http.method":U,"http.target":e.url}},l))}catch(t){if(t instanceof g.NoFallbackError||await N.onRequestError(e,t,{routerKind:"App Router",routePath:P,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:D,isOnDemandRevalidate:j})},!1,C),q)throw t;return await (0,c.sendResponse)(K,L,new Response(null,{status:500})),null}}e.s(["handler",()=>k,"patchFetch",()=>A,"routeModule",()=>N,"serverHooks",()=>T,"workAsyncStorage",()=>j,"workUnitAsyncStorage",()=>S],891810)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__7b365072._.js.map