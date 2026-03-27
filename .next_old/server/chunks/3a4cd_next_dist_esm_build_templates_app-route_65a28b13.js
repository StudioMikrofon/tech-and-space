module.exports=[772469,e=>{"use strict";var t=e.i(516669),n=e.i(165195),a=e.i(47167),o=e.i(322887),i=e.i(253219),r=e.i(700279),s=e.i(430803),l=e.i(478041),p=e.i(997684),c=e.i(515157),d=e.i(125451),u=e.i(833697),h=e.i(302794),m=e.i(903936),g=e.i(124496),f=e.i(193695);e.i(667545);var E=e.i(631e3),y=e.i(818814);let w=process.env.OPENAI_API_KEY,R=process.env.ANTHROPIC_API_KEY,T=process.env.MISTRAL_API_KEY,v=`You are a developer prompt rephraser. Your ONLY job is to take the user's casual description and rephrase it as a professional, technical development request — nothing more.

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

The prompt must be in English regardless of input language. Never include placeholders. Never ask clarifying questions.`,x=`You are a powerful editorial agent embedded in TECH & SPACE — a dark sci-fi tech news portal (Next.js). You have full access to edit anything on the page AND trigger backend pipeline operations.

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
IMPORTANT: Return ONLY valid JSON. No markdown, no code blocks, no explanation outside JSON.`,N={"gpt-5-nano":{provider:"openai",id:"gpt-5-nano",label:"GPT-5 Nano"},"gpt-5-mini":{provider:"openai",id:"gpt-5-mini",label:"GPT-5 Mini"},"claude-opus":{provider:"anthropic",id:"claude-opus-4-6",label:"Claude Opus 4.6"},"claude-haiku":{provider:"anthropic",id:"claude-haiku-4-5-20251001",label:"Claude Haiku"},"claude-sonnet":{provider:"anthropic",id:"claude-sonnet-4-6",label:"Claude Sonnet"},"mistral-small":{provider:"mistral",id:"mistral-small-latest",label:"Mistral Small"},"mistral-large":{provider:"mistral",id:"mistral-large-latest",label:"Mistral Large"},"open-mistral-nemo":{provider:"mistral",id:"open-mistral-nemo",label:"Mistral Nemo"}};async function A(e,t){let n=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${w}`},body:JSON.stringify({model:e,messages:[{role:"system",content:x},{role:"user",content:t}],max_completion_tokens:16e3})});if(!n.ok)throw Error(`OpenAI ${n.status}: ${await n.text()}`);let a=await n.json();return a.choices?.[0]?.message?.content||"{}"}async function O(e,t){let n=await fetch("https://api.mistral.ai/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${T}`},body:JSON.stringify({model:e,messages:[{role:"system",content:x},{role:"user",content:t}],max_tokens:2e3})});if(!n.ok)throw Error(`Mistral ${n.status}: ${await n.text()}`);let a=await n.json();return a.choices?.[0]?.message?.content||"{}"}async function C(e,t){let n=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":R,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:e,system:x,messages:[{role:"user",content:t}],max_tokens:2e3})});if(!n.ok)throw Error(`Anthropic ${n.status}: ${await n.text()}`);let a=await n.json();return a.content?.[0]?.text||"{}"}async function S(e){let{instruction:t,selectedText:n,selectedInfo:a,pageContext:o,bodyContext:i,model:r="gpt-5-nano",mode:s}=await e.json();if(!t?.trim())return y.NextResponse.json({error:"No instruction provided"},{status:400});let l=N[r]??N["gpt-5-nano"];if("reformulate"===s){let e=[n?`SELECTED ELEMENT:
${a?`${a}
`:""}${n.trim().slice(0,400)}`:null,`USER DESCRIPTION: ${t.trim()}`].filter(Boolean).join("\n\n");try{let t;if("openai"===l.provider){let n=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${w}`},body:JSON.stringify({model:l.id,messages:[{role:"system",content:v},{role:"user",content:e}],max_completion_tokens:4e3})});if(!n.ok)throw Error(`OpenAI ${n.status}`);let a=await n.json();t=a.choices?.[0]?.message?.content||"{}"}else if("mistral"===l.provider){let n=await fetch("https://api.mistral.ai/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${T}`},body:JSON.stringify({model:l.id,messages:[{role:"system",content:v},{role:"user",content:e}],max_tokens:1e3})});if(!n.ok)throw Error(`Mistral ${n.status}`);let a=await n.json();t=a.choices?.[0]?.message?.content||"{}"}else{let n=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":R,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:l.id,system:v,messages:[{role:"user",content:e}],max_tokens:1e3})});if(!n.ok)throw Error(`Anthropic ${n.status}`);let a=await n.json();t=a.content?.[0]?.text||"{}"}let n=t.replace(/^```(?:json)?\n?/m,"").replace(/\n?```$/m,"").trim();try{return y.NextResponse.json(JSON.parse(n))}catch{return y.NextResponse.json({action:"prompt",content:n,explanation:""})}}catch(e){return y.NextResponse.json({error:e instanceof Error?e.message:String(e)},{status:500})}}if("openai"===l.provider&&!w)return y.NextResponse.json({error:"OpenAI API key not configured"},{status:500});if("anthropic"===l.provider&&!R)return y.NextResponse.json({error:"Anthropic API key not configured — add ANTHROPIC_API_KEY to .env.local"},{status:500});let p=[n?`SELECTED ELEMENT ON PAGE:
${a?`Element: ${a}
`:""}Text content:
${n.trim().slice(0,800)}`:null,o?`PAGE CONTEXT:
${o.trim().slice(0,400)}`:null,i?`ARTICLE BODY TEXT (use this to find exact "original" text for rewrite):
${i.trim().slice(0,2e3)}`:null,`USER INSTRUCTION: ${t.trim()}`].filter(Boolean).join("\n\n");try{let e,t=("openai"===l.provider?await A(l.id,p):"mistral"===l.provider?await O(l.id,p):await C(l.id,p)).replace(/^```(?:json)?\n?/m,"").replace(/\n?```$/m,"").trim();try{e=JSON.parse(t)}catch{e={action:"info",content:t,explanation:""}}return y.NextResponse.json(e)}catch(t){let e=t instanceof Error?t.message:String(t);return y.NextResponse.json({error:e},{status:500})}}e.s(["POST",()=>S],223370);var b=e.i(223370);let P=new t.AppRouteRouteModule({definition:{kind:n.RouteKind.APP_ROUTE,page:"/api/agent/route",pathname:"/api/agent",filename:"route",bundlePath:""},distDir:".next_building",relativeProjectDir:"",resolvedPagePath:"[project]/openclaw/workspace/tech-pulse-css/app/api/agent/route.ts",nextConfigOutput:"",userland:b}),{workAsyncStorage:I,workUnitAsyncStorage:_,serverHooks:k}=P;function j(){return(0,a.patchFetch)({workAsyncStorage:I,workUnitAsyncStorage:_})}async function $(e,t,a){P.isDev&&(0,o.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let y="/api/agent/route";y=y.replace(/\/index$/,"")||"/";let w=await P.prepare(e,t,{srcPage:y,multiZoneDraftMode:!1});if(!w)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:R,params:T,nextConfig:v,parsedUrl:x,isDraftMode:N,prerenderManifest:A,routerServerContext:O,isOnDemandRevalidate:C,revalidateOnlyGenerated:S,resolvedPathname:b,clientReferenceManifest:I,serverActionsManifest:_}=w,k=(0,s.normalizeAppPath)(y),j=!!(A.dynamicRoutes[k]||A.routes[b]),$=async()=>((null==O?void 0:O.render404)?await O.render404(e,t,x,!1):t.end("This page could not be found"),null);if(j&&!N){let e=!!A.routes[b],t=A.dynamicRoutes[k];if(t&&!1===t.fallback&&!e){if(v.experimental.adapterPath)return await $();throw new f.NoFallbackError}}let U=null;!j||P.isDev||N||(U="/index"===(U=b)?"/":U);let M=!0===P.isDev||!j,D=j&&!M;_&&I&&(0,r.setManifestsSingleton)({page:y,clientReferenceManifest:I,serverActionsManifest:_});let L=e.method||"GET",H=(0,i.getTracer)(),q=H.getActiveScopeSpan(),Y={params:T,prerenderManifest:A,renderOpts:{experimental:{authInterrupts:!!v.experimental.authInterrupts},cacheComponents:!!v.cacheComponents,supportsDynamicResponse:M,incrementalCache:(0,o.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:v.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,n,a,o)=>P.onRequestError(e,t,a,o,O)},sharedContext:{buildId:R}},B=new l.NodeNextRequest(e),F=new l.NodeNextResponse(t),K=p.NextRequestAdapter.fromNodeNextRequest(B,(0,p.signalFromNodeResponse)(t));try{let r=async e=>P.handle(K,Y).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let n=H.getRootSpanAttributes();if(!n)return;if(n.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${n.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=n.get("next.route");if(a){let t=`${L} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${L} ${y}`)}),s=!!(0,o.getRequestMeta)(e,"minimalMode"),l=async o=>{var i,l;let p=async({previousCacheEntry:n})=>{try{if(!s&&C&&S&&!n)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let i=await r(o);e.fetchMetrics=Y.renderOpts.fetchMetrics;let l=Y.renderOpts.pendingWaitUntil;l&&a.waitUntil&&(a.waitUntil(l),l=void 0);let p=Y.renderOpts.collectedTags;if(!j)return await (0,u.sendResponse)(B,F,i,Y.renderOpts.pendingWaitUntil),null;{let e=await i.blob(),t=(0,h.toNodeOutgoingHttpHeaders)(i.headers);p&&(t[g.NEXT_CACHE_TAGS_HEADER]=p),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let n=void 0!==Y.renderOpts.collectedRevalidate&&!(Y.renderOpts.collectedRevalidate>=g.INFINITE_CACHE)&&Y.renderOpts.collectedRevalidate,a=void 0===Y.renderOpts.collectedExpire||Y.renderOpts.collectedExpire>=g.INFINITE_CACHE?void 0:Y.renderOpts.collectedExpire;return{value:{kind:E.CachedRouteKind.APP_ROUTE,status:i.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:n,expire:a}}}}catch(t){throw(null==n?void 0:n.isStale)&&await P.onRequestError(e,t,{routerKind:"App Router",routePath:y,routeType:"route",revalidateReason:(0,d.getRevalidateReason)({isStaticGeneration:D,isOnDemandRevalidate:C})},!1,O),t}},c=await P.handleResponse({req:e,nextConfig:v,cacheKey:U,routeKind:n.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:A,isRoutePPREnabled:!1,isOnDemandRevalidate:C,revalidateOnlyGenerated:S,responseGenerator:p,waitUntil:a.waitUntil,isMinimalMode:s});if(!j)return null;if((null==c||null==(i=c.value)?void 0:i.kind)!==E.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==c||null==(l=c.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});s||t.setHeader("x-nextjs-cache",C?"REVALIDATED":c.isMiss?"MISS":c.isStale?"STALE":"HIT"),N&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let f=(0,h.fromNodeOutgoingHttpHeaders)(c.value.headers);return s&&j||f.delete(g.NEXT_CACHE_TAGS_HEADER),!c.cacheControl||t.getHeader("Cache-Control")||f.get("Cache-Control")||f.set("Cache-Control",(0,m.getCacheControlHeader)(c.cacheControl)),await (0,u.sendResponse)(B,F,new Response(c.value.body,{headers:f,status:c.value.status||200})),null};q?await l(q):await H.withPropagatedContext(e.headers,()=>H.trace(c.BaseServerSpan.handleRequest,{spanName:`${L} ${y}`,kind:i.SpanKind.SERVER,attributes:{"http.method":L,"http.target":e.url}},l))}catch(t){if(t instanceof f.NoFallbackError||await P.onRequestError(e,t,{routerKind:"App Router",routePath:k,routeType:"route",revalidateReason:(0,d.getRevalidateReason)({isStaticGeneration:D,isOnDemandRevalidate:C})},!1,O),j)throw t;return await (0,u.sendResponse)(B,F,new Response(null,{status:500})),null}}e.s(["handler",()=>$,"patchFetch",()=>j,"routeModule",()=>P,"serverHooks",()=>k,"workAsyncStorage",()=>I,"workUnitAsyncStorage",()=>_],772469)}];

//# sourceMappingURL=3a4cd_next_dist_esm_build_templates_app-route_65a28b13.js.map