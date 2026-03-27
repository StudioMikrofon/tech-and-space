(()=>{var a={};a.id=893,a.ids=[893],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},29021:a=>{"use strict";a.exports=require("fs")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33873:a=>{"use strict";a.exports=require("path")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},46895:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>J,patchFetch:()=>I,routeModule:()=>E,serverHooks:()=>H,workAsyncStorage:()=>F,workUnitAsyncStorage:()=>G});var d={};c.r(d),c.d(d,{POST:()=>D});var e=c(19225),f=c(84006),g=c(8317),h=c(99373),i=c(34775),j=c(24235),k=c(261),l=c(54365),m=c(90771),n=c(73461),o=c(67798),p=c(92280),q=c(62018),r=c(45696),s=c(47929),t=c(86439),u=c(37527),v=c(45592),w=c(79748),x=c(29021),y=c(33873),z=c.n(y),A=c(79646);let B="/opt/openclaw/workspace/tech-pulse-css",C="/opt/openclaw/futurepulse";async function D(a){var b,c,d,e,f,g;let h,i,j,k,l;if((a.headers.get("content-type")||"").includes("multipart/form-data")){let b=await a.formData();h=Number(b.get("articleId")),i=b.get("imageType")||"main",l=b.get("alt")||"";let c=b.get("file");if(!c)return v.NextResponse.json({error:"No file"},{status:400});let d=await c.arrayBuffer();j=Buffer.from(d);let e=c.type;k="image/png"===e?".png":"image/webp"===e?".webp":".jpg"}else{let b=await a.json();h=Number(b.articleId),i=b.imageType||"main",l=b.alt||"";let c=b.imageUrl;if(!c)return v.NextResponse.json({error:"No imageUrl"},{status:400});let d=await fetch(c,{headers:{"User-Agent":"Mozilla/5.0"}});if(!d.ok)return v.NextResponse.json({error:`Fetch failed: ${d.status}`},{status:400});let e=await d.arrayBuffer();j=Buffer.from(e);let f=d.headers.get("content-type")||"";k=f.includes("png")?".png":f.includes("webp")?".webp":".jpg"}if(!h||isNaN(h))return v.NextResponse.json({error:"Invalid articleId"},{status:400});let m=`
import sys, sqlite3
conn = sqlite3.connect('${C}/db/futurepulse.db')
row = conn.execute('SELECT title_en, title FROM articles WHERE id=${h}').fetchone()
conn.close()
if not row: sys.exit(1)
import re
title = (row[0] or row[1] or '').lower()
char_map = {'č':'c','ć':'c','š':'s','ž':'z','đ':'dj'}
for s,d in char_map.items(): title = title.replace(s,d)
title = title.encode('ascii','ignore').decode()
slug = re.sub(r'[^a-z0-9]+','-',title).strip('-')[:50]
print(slug)
`,n=await new Promise(a=>{let b="",c=(0,A.spawn)(`${C}/venv/bin/python3`,["-c",m]);c.stdout.on("data",a=>b+=a.toString()),c.on("close",()=>a(b.trim()))});if(!n)return v.NextResponse.json({error:"Article not found"},{status:404});let o=z().join(B,"public","images","articles",n);(0,x.existsSync)(o)||await (0,w.mkdir)(o,{recursive:!0});let p="main"===i?`main${k}`:`subtitle${k}`,q=z().join(o,p);await (0,w.writeFile)(q,j);let r=`/images/articles/${n}/${p}`;return await (b=h,c=i,d=l||n,new Promise(a=>{let e=`
import sys, json
sys.path.insert(0, '${C}')
from core.db import Database
db = Database()
conn = db.get_conn()
row = conn.execute('SELECT images_json FROM articles WHERE id=?', (${b},)).fetchone()
raw = row[0] if row else '{}'
try:
    imgs = json.loads(raw or '{}')
except:
    imgs = {}
imgs['${"main"===c?"image_main":"image_subtitle"}'] = {'url': '${r}', 'alt': '${d}'}
conn.execute('UPDATE articles SET images_json=? WHERE id=?', (json.dumps(imgs), ${b}))
conn.commit()
conn.close()
print('ok')
`;(0,A.spawn)(`${C}/venv/bin/python3`,["-c",e],{cwd:C}).on("close",()=>a())})),await (e=h,f=i,g=l||n,new Promise(a=>{let b="main"===f?"image":"subtitleImage",c=`
import sys, re
sys.path.insert(0, '${C}')
import sqlite3
conn = sqlite3.connect('${C}/db/futurepulse.db')
row = conn.execute('SELECT title_en, category FROM articles WHERE id=?', (${e},)).fetchone()
conn.close()
if not row: sys.exit(0)

import pathlib, glob
content_dir = pathlib.Path('${B}/content')
for mdx in content_dir.rglob('index.mdx'):
    text = mdx.read_text(encoding='utf-8')
    if 'db_id: ${e}' not in text:
        continue
    fm_end = text.index('\\n---\\n', 4) + 5
    fm = text[4:fm_end-4]
    body = text[fm_end:]

    if '${b}:' in fm:
        fm = re.sub(
            r'${b}:\\s*\\n(?:  .*\\n)*',
            '${b}:\\n  url: "${r}"\\n  alt: "${g}"\\n',
            fm
        )
    else:
        fm = fm.rstrip() + '\\n${b}:\\n  url: "${r}"\\n  alt: "${g}"\\n'

    mdx.write_text('---\\n' + fm + '---\\n' + body, encoding='utf-8')
    print('updated:', str(mdx))
    break
`;(0,A.spawn)(`${C}/venv/bin/python3`,["-c",c],{cwd:C}).on("close",()=>a())})),v.NextResponse.json({ok:!0,url:r})}let E=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/upload-image/route",pathname:"/api/upload-image",filename:"route",bundlePath:"app/api/upload-image/route"},distDir:".next_prod",relativeProjectDir:"",resolvedPagePath:"/opt/openclaw/workspace/tech-pulse-css/app/api/upload-image/route.ts",nextConfigOutput:"",userland:d}),{workAsyncStorage:F,workUnitAsyncStorage:G,serverHooks:H}=E;function I(){return(0,g.patchFetch)({workAsyncStorage:F,workUnitAsyncStorage:G})}async function J(a,b,c){E.isDev&&(0,h.addRequestMeta)(a,"devRequestTimingInternalsEnd",process.hrtime.bigint());let d="/api/upload-image/route";"/index"===d&&(d="/");let e=await E.prepare(a,b,{srcPage:d,multiZoneDraftMode:!1});if(!e)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:g,params:v,nextConfig:w,parsedUrl:x,isDraftMode:y,prerenderManifest:z,routerServerContext:A,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,resolvedPathname:D,clientReferenceManifest:F,serverActionsManifest:G}=e,H=(0,k.normalizeAppPath)(d),I=!!(z.dynamicRoutes[H]||z.routes[D]),J=async()=>((null==A?void 0:A.render404)?await A.render404(a,b,x,!1):b.end("This page could not be found"),null);if(I&&!y){let a=!!z.routes[D],b=z.dynamicRoutes[H];if(b&&!1===b.fallback&&!a){if(w.experimental.adapterPath)return await J();throw new t.NoFallbackError}}let K=null;!I||E.isDev||y||(K="/index"===(K=D)?"/":K);let L=!0===E.isDev||!I,M=I&&!L;G&&F&&(0,j.setManifestsSingleton)({page:d,clientReferenceManifest:F,serverActionsManifest:G});let N=a.method||"GET",O=(0,i.getTracer)(),P=O.getActiveScopeSpan(),Q={params:v,prerenderManifest:z,renderOpts:{experimental:{authInterrupts:!!w.experimental.authInterrupts},cacheComponents:!!w.cacheComponents,supportsDynamicResponse:L,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:w.cacheLife,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d,e)=>E.onRequestError(a,b,d,e,A)},sharedContext:{buildId:g}},R=new l.NodeNextRequest(a),S=new l.NodeNextResponse(b),T=m.NextRequestAdapter.fromNodeNextRequest(R,(0,m.signalFromNodeResponse)(b));try{let e=async a=>E.handle(T,Q).finally(()=>{if(!a)return;a.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let c=O.getRootSpanAttributes();if(!c)return;if(c.get("next.span_type")!==n.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${c.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=c.get("next.route");if(e){let b=`${N} ${e}`;a.setAttributes({"next.route":e,"http.route":e,"next.span_name":b}),a.updateName(b)}else a.updateName(`${N} ${d}`)}),g=!!(0,h.getRequestMeta)(a,"minimalMode"),j=async h=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!g&&B&&C&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let d=await e(h);a.fetchMetrics=Q.renderOpts.fetchMetrics;let i=Q.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=Q.renderOpts.collectedTags;if(!I)return await (0,p.I)(R,S,d,Q.renderOpts.pendingWaitUntil),null;{let a=await d.blob(),b=(0,q.toNodeOutgoingHttpHeaders)(d.headers);j&&(b[s.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==Q.renderOpts.collectedRevalidate&&!(Q.renderOpts.collectedRevalidate>=s.INFINITE_CACHE)&&Q.renderOpts.collectedRevalidate,e=void 0===Q.renderOpts.collectedExpire||Q.renderOpts.collectedExpire>=s.INFINITE_CACHE?void 0:Q.renderOpts.collectedExpire;return{value:{kind:u.CachedRouteKind.APP_ROUTE,status:d.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:e}}}}catch(b){throw(null==f?void 0:f.isStale)&&await E.onRequestError(a,b,{routerKind:"App Router",routePath:d,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:M,isOnDemandRevalidate:B})},!1,A),b}},l=await E.handleResponse({req:a,nextConfig:w,cacheKey:K,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:z,isRoutePPREnabled:!1,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,responseGenerator:k,waitUntil:c.waitUntil,isMinimalMode:g});if(!I)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==u.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});g||b.setHeader("x-nextjs-cache",B?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),y&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,q.fromNodeOutgoingHttpHeaders)(l.value.headers);return g&&I||m.delete(s.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,r.getCacheControlHeader)(l.cacheControl)),await (0,p.I)(R,S,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};P?await j(P):await O.withPropagatedContext(a.headers,()=>O.trace(n.BaseServerSpan.handleRequest,{spanName:`${N} ${d}`,kind:i.SpanKind.SERVER,attributes:{"http.method":N,"http.target":a.url}},j))}catch(b){if(b instanceof t.NoFallbackError||await E.onRequestError(a,b,{routerKind:"App Router",routePath:H,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:M,isOnDemandRevalidate:B})},!1,A),I)throw b;return await (0,p.I)(R,S,new Response(null,{status:500})),null}}},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},78335:()=>{},79646:a=>{"use strict";a.exports=require("child_process")},79748:a=>{"use strict";a.exports=require("fs/promises")},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},96487:()=>{}};var b=require("../../../webpack-runtime.js");b.C(a);var c=b.X(0,[445,813],()=>b(b.s=46895));module.exports=c})();