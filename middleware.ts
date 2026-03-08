import { NextRequest, NextResponse } from "next/server";

// Language codes for Croatian/Bosnian/Serbian — redirect to /hr/
const HR_LANGS = new Set(["hr", "bs", "sr", "hr-hr", "bs-ba", "sr-rs", "sr-latn", "cnr"]);

const PREF_COOKIE = "lang-pref";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip: /hr/* already correct, /api/*, /_next/*, static files
  if (
    pathname.startsWith("/hr") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // If user has explicit lang preference cookie → respect it
  const pref = req.cookies.get(PREF_COOKIE)?.value;
  if (pref === "en") return NextResponse.next();
  if (pref === "hr") {
    const url = req.nextUrl.clone();
    url.pathname = "/hr" + pathname;
    return NextResponse.redirect(url, { status: 302 });
  }

  // Auto-detect from Accept-Language header
  const acceptLang = req.headers.get("accept-language") || "";
  const firstLang = acceptLang.split(",")[0]?.split(";")[0]?.trim().toLowerCase() || "";
  if (HR_LANGS.has(firstLang)) {
    const url = req.nextUrl.clone();
    url.pathname = "/hr" + pathname;
    return NextResponse.redirect(url, { status: 302 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.jpg|images|textures|sounds|fonts|api).*)",
  ],
};
