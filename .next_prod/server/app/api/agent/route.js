(()=>{var a={};a.id=429,a.ids=[429],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},73396:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>L,patchFetch:()=>K,routeModule:()=>G,serverHooks:()=>J,workAsyncStorage:()=>H,workUnitAsyncStorage:()=>I});var d={};c.r(d),c.d(d,{POST:()=>F});var e=c(19225),f=c(84006),g=c(8317),h=c(99373),i=c(34775),j=c(24235),k=c(261),l=c(54365),m=c(90771),n=c(73461),o=c(67798),p=c(92280),q=c(62018),r=c(45696),s=c(47929),t=c(86439),u=c(37527),v=c(45592);let w=process.env.OPENAI_API_KEY,x=process.env.ANTHROPIC_API_KEY,y=process.env.MISTRAL_API_KEY,z=`You are a developer prompt rephraser. Your ONLY job is to take the user's casual description and rephrase it as a professional, technical development request — nothing more.

STRICT RULES:
- Do NOT add suggestions, planning steps, or anything the user did not explicitly mention
- Do NOT propose solutions or approaches
- Do NOT expand scope beyond exactly what the user described
- ONLY rephrase the user's exact words more professionally and technically
- The output must represent the same intent as the input — same scope, just more precise language

Return ONLY valid JSON:
{
  "action": "prompt",
  "content": "the professionally rephrased English prompt, 1-3 sentences",
  "explanation": "one-line Croatian summary"
}

The prompt must be in English regardless of input language. Never include placeholders. Never ask clarifying questions.`,A=`You are a powerful editorial agent embedded in TECH & SPACE — a dark sci-fi tech news portal (Next.js). You have full access to edit anything on the page AND trigger backend pipeline operations.

═══ TYPE 1: TEXT / VISUAL EDITS ═══

Use action "rewrite" to change any text on the page (titles, body, subtitles, any text).
Use action "style" to inject CSS changes.
Use action "info" to answer questions.

CRITICAL RULE FOR REWRITE: You MUST include BOTH fields:
- "content": the NEW text to replace with
- "original": the EXACT verbatim original text from the page (copy it character-for-character)
The system will do an automatic find-and-replace in the DOM using "original" as the search key.
If you don't include "original", the Apply button won't work. Always include it.

═══ TYPE 2: BACKEND OPERATIONS ═══

1. GENERATE / REGENERATE IMAGE:
   endpoint: "/api/image-regen"
   payload: { "id": <db_id number or null>, "image_type": "main", "model": "qwen", "title": "<h1 text>", "category": "<category>" }
   - ALWAYS include "title" (from the page h1) and "category" regardless of whether id is null or not
   - Default model is ALWAYS "qwen". Use "openai" ONLY if user explicitly asks for it
   - "image_type": use "main" for hero image, "subtitle" for middle image, null for auto

2. PUBLISH with ending:
   endpoint: "/api/editorial"
   payload: { "id": <db_id>, "action": "ending", "ending": "A" | "B" | "C" }

3. Mark for rewrite:
   endpoint: "/api/editorial"
   payload: { "id": <db_id>, "action": "rewrite" }

4. Reject article:
   endpoint: "/api/editorial"
   payload: { "id": <db_id>, "action": "reject" }

HOW TO FIND db_id: In page context you'll see "db#150" — that number is the db_id. Extract ONLY the number (e.g. 150). If you don't see it, set id to null.

═══ RESPONSE FORMAT ═══

For text/visual edits:
{
  "action": "rewrite",
  "content": "replacement text here",
  "original": "EXACT original text from page to find",
  "explanation": "one line in user's language"
}

For CSS changes:
{
  "action": "style",
  "content": "CSS rules here",
  "explanation": "one line"
}

For information/answers:
{
  "action": "info",
  "content": "answer here",
  "explanation": ""
}

For backend calls:
{
  "action": "backend_call",
  "endpoint": "/api/image-regen",
  "payload": { "id": null, "image_type": "main", "model": "qwen", "title": "Article Title Here", "category": "ai" },
  "content": "What will happen",
  "explanation": "one line"
}

LANGUAGE: Always respond in the same language the user writes in (Croatian if they write in Croatian).
IMPORTANT: Return ONLY valid JSON. No markdown, no code blocks, no explanation outside JSON.`,B={"gpt-5-nano":{provider:"openai",id:"gpt-5-nano",label:"GPT-5 Nano"},"gpt-5-mini":{provider:"openai",id:"gpt-5-mini",label:"GPT-5 Mini"},"claude-opus":{provider:"anthropic",id:"claude-opus-4-6",label:"Claude Opus 4.6"},"claude-haiku":{provider:"anthropic",id:"claude-haiku-4-5-20251001",label:"Claude Haiku"},"claude-sonnet":{provider:"anthropic",id:"claude-sonnet-4-6",label:"Claude Sonnet"},"mistral-small":{provider:"mistral",id:"mistral-small-latest",label:"Mistral Small"},"mistral-large":{provider:"mistral",id:"mistral-large-latest",label:"Mistral Large"},"open-mistral-nemo":{provider:"mistral",id:"open-mistral-nemo",label:"Mistral Nemo"}};async function C(a,b){let c=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${w}`},body:JSON.stringify({model:a,messages:[{role:"system",content:A},{role:"user",content:b}],max_completion_tokens:16e3})});if(!c.ok)throw Error(`OpenAI ${c.status}: ${await c.text()}`);let d=await c.json();return d.choices?.[0]?.message?.content||"{}"}async function D(a,b){let c=await fetch("https://api.mistral.ai/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${y}`},body:JSON.stringify({model:a,messages:[{role:"system",content:A},{role:"user",content:b}],max_tokens:2e3})});if(!c.ok)throw Error(`Mistral ${c.status}: ${await c.text()}`);let d=await c.json();return d.choices?.[0]?.message?.content||"{}"}async function E(a,b){let c=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":x,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:a,system:A,messages:[{role:"user",content:b}],max_tokens:2e3})});if(!c.ok)throw Error(`Anthropic ${c.status}: ${await c.text()}`);let d=await c.json();return d.content?.[0]?.text||"{}"}async function F(a){let{instruction:b,selectedText:c,selectedInfo:d,pageContext:e,bodyContext:f,model:g="gpt-5-nano",mode:h}=await a.json();if(!b?.trim())return v.NextResponse.json({error:"No instruction provided"},{status:400});let i=B[g]??B["gpt-5-nano"];if("reformulate"===h){let a=[c?`SELECTED ELEMENT:
${d?`${d}
`:""}${c.trim().slice(0,400)}`:null,`USER DESCRIPTION: ${b.trim()}`].filter(Boolean).join("\n\n");try{let b;if("openai"===i.provider){let c=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${w}`},body:JSON.stringify({model:i.id,messages:[{role:"system",content:z},{role:"user",content:a}],max_completion_tokens:4e3})});if(!c.ok)throw Error(`OpenAI ${c.status}`);let d=await c.json();b=d.choices?.[0]?.message?.content||"{}"}else if("mistral"===i.provider){let c=await fetch("https://api.mistral.ai/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${y}`},body:JSON.stringify({model:i.id,messages:[{role:"system",content:z},{role:"user",content:a}],max_tokens:1e3})});if(!c.ok)throw Error(`Mistral ${c.status}`);let d=await c.json();b=d.choices?.[0]?.message?.content||"{}"}else{let c=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":x,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:i.id,system:z,messages:[{role:"user",content:a}],max_tokens:1e3})});if(!c.ok)throw Error(`Anthropic ${c.status}`);let d=await c.json();b=d.content?.[0]?.text||"{}"}let c=b.replace(/^```(?:json)?\n?/m,"").replace(/\n?```$/m,"").trim();try{return v.NextResponse.json(JSON.parse(c))}catch{return v.NextResponse.json({action:"prompt",content:c,explanation:""})}}catch(a){return v.NextResponse.json({error:a instanceof Error?a.message:String(a)},{status:500})}}if("openai"===i.provider&&!w)return v.NextResponse.json({error:"OpenAI API key not configured"},{status:500});if("anthropic"===i.provider&&!x)return v.NextResponse.json({error:"Anthropic API key not configured — add ANTHROPIC_API_KEY to .env.local"},{status:500});let j=[c?`SELECTED ELEMENT ON PAGE:
${d?`Element: ${d}
`:""}Text content:
${c.trim().slice(0,800)}`:null,e?`PAGE CONTEXT:
${e.trim().slice(0,400)}`:null,f?`ARTICLE BODY TEXT (use this to find exact "original" text for rewrite):
${f.trim().slice(0,2e3)}`:null,`USER INSTRUCTION: ${b.trim()}`].filter(Boolean).join("\n\n");try{let a,b=("openai"===i.provider?await C(i.id,j):"mistral"===i.provider?await D(i.id,j):await E(i.id,j)).replace(/^```(?:json)?\n?/m,"").replace(/\n?```$/m,"").trim();try{a=JSON.parse(b)}catch{a={action:"info",content:b,explanation:""}}return v.NextResponse.json(a)}catch(b){let a=b instanceof Error?b.message:String(b);return v.NextResponse.json({error:a},{status:500})}}let G=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/agent/route",pathname:"/api/agent",filename:"route",bundlePath:"app/api/agent/route"},distDir:".next_prod",relativeProjectDir:"",resolvedPagePath:"/opt/openclaw/workspace/tech-pulse-css/app/api/agent/route.ts",nextConfigOutput:"",userland:d}),{workAsyncStorage:H,workUnitAsyncStorage:I,serverHooks:J}=G;function K(){return(0,g.patchFetch)({workAsyncStorage:H,workUnitAsyncStorage:I})}async function L(a,b,c){G.isDev&&(0,h.addRequestMeta)(a,"devRequestTimingInternalsEnd",process.hrtime.bigint());let d="/api/agent/route";"/index"===d&&(d="/");let e=await G.prepare(a,b,{srcPage:d,multiZoneDraftMode:!1});if(!e)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:g,params:v,nextConfig:w,parsedUrl:x,isDraftMode:y,prerenderManifest:z,routerServerContext:A,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,resolvedPathname:D,clientReferenceManifest:E,serverActionsManifest:F}=e,H=(0,k.normalizeAppPath)(d),I=!!(z.dynamicRoutes[H]||z.routes[D]),J=async()=>((null==A?void 0:A.render404)?await A.render404(a,b,x,!1):b.end("This page could not be found"),null);if(I&&!y){let a=!!z.routes[D],b=z.dynamicRoutes[H];if(b&&!1===b.fallback&&!a){if(w.experimental.adapterPath)return await J();throw new t.NoFallbackError}}let K=null;!I||G.isDev||y||(K="/index"===(K=D)?"/":K);let L=!0===G.isDev||!I,M=I&&!L;F&&E&&(0,j.setManifestsSingleton)({page:d,clientReferenceManifest:E,serverActionsManifest:F});let N=a.method||"GET",O=(0,i.getTracer)(),P=O.getActiveScopeSpan(),Q={params:v,prerenderManifest:z,renderOpts:{experimental:{authInterrupts:!!w.experimental.authInterrupts},cacheComponents:!!w.cacheComponents,supportsDynamicResponse:L,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:w.cacheLife,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d,e)=>G.onRequestError(a,b,d,e,A)},sharedContext:{buildId:g}},R=new l.NodeNextRequest(a),S=new l.NodeNextResponse(b),T=m.NextRequestAdapter.fromNodeNextRequest(R,(0,m.signalFromNodeResponse)(b));try{let e=async a=>G.handle(T,Q).finally(()=>{if(!a)return;a.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let c=O.getRootSpanAttributes();if(!c)return;if(c.get("next.span_type")!==n.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${c.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=c.get("next.route");if(e){let b=`${N} ${e}`;a.setAttributes({"next.route":e,"http.route":e,"next.span_name":b}),a.updateName(b)}else a.updateName(`${N} ${d}`)}),g=!!(0,h.getRequestMeta)(a,"minimalMode"),j=async h=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!g&&B&&C&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let d=await e(h);a.fetchMetrics=Q.renderOpts.fetchMetrics;let i=Q.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=Q.renderOpts.collectedTags;if(!I)return await (0,p.I)(R,S,d,Q.renderOpts.pendingWaitUntil),null;{let a=await d.blob(),b=(0,q.toNodeOutgoingHttpHeaders)(d.headers);j&&(b[s.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==Q.renderOpts.collectedRevalidate&&!(Q.renderOpts.collectedRevalidate>=s.INFINITE_CACHE)&&Q.renderOpts.collectedRevalidate,e=void 0===Q.renderOpts.collectedExpire||Q.renderOpts.collectedExpire>=s.INFINITE_CACHE?void 0:Q.renderOpts.collectedExpire;return{value:{kind:u.CachedRouteKind.APP_ROUTE,status:d.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:e}}}}catch(b){throw(null==f?void 0:f.isStale)&&await G.onRequestError(a,b,{routerKind:"App Router",routePath:d,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:M,isOnDemandRevalidate:B})},!1,A),b}},l=await G.handleResponse({req:a,nextConfig:w,cacheKey:K,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:z,isRoutePPREnabled:!1,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,responseGenerator:k,waitUntil:c.waitUntil,isMinimalMode:g});if(!I)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==u.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});g||b.setHeader("x-nextjs-cache",B?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),y&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,q.fromNodeOutgoingHttpHeaders)(l.value.headers);return g&&I||m.delete(s.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,r.getCacheControlHeader)(l.cacheControl)),await (0,p.I)(R,S,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};P?await j(P):await O.withPropagatedContext(a.headers,()=>O.trace(n.BaseServerSpan.handleRequest,{spanName:`${N} ${d}`,kind:i.SpanKind.SERVER,attributes:{"http.method":N,"http.target":a.url}},j))}catch(b){if(b instanceof t.NoFallbackError||await G.onRequestError(a,b,{routerKind:"App Router",routePath:H,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:M,isOnDemandRevalidate:B})},!1,A),I)throw b;return await (0,p.I)(R,S,new Response(null,{status:500})),null}}},78335:()=>{},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},96487:()=>{}};var b=require("../../../webpack-runtime.js");b.C(a);var c=b.X(0,[445,813],()=>b(b.s=73396));module.exports=c})();