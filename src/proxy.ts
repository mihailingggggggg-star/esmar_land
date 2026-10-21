import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, localeCookie, type Locale } from "@/i18n/config";

const STATIC_PREFIXES = ["/api", "/_next", "/brand", "/objects", "/fonts", "/admin"];
const STATIC_FILES = new Set(["/favicon.svg", "/favicon.ico", "/robots.txt", "/sitemap.xml"]);

function fromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const entries = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of entries) {
    if (tag.startsWith("ky")) return "ky";
    if (tag.startsWith("ru")) return "ru";
    if (tag.startsWith("kk") || tag.startsWith("uz") || tag.startsWith("be")) return "ru";
  }
  return null;
}

function detectLocale(request: NextRequest): Locale {
  const lang = request.nextUrl.searchParams.get("lang");
  if (isLocale(lang)) return lang;

  const cookie = request.cookies.get(localeCookie)?.value;
  if (isLocale(cookie)) return cookie;

  const fromHeader = fromAcceptLanguage(request.headers.get("accept-language"));
  if (fromHeader) return fromHeader;

  const country = (
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    ""
  ).toUpperCase();
  if (country === "KG") return "ky";

  return defaultLocale;
}

function forwardWithLocale(request: NextRequest, locale: Locale) {
  const headers = new Headers(request.headers);
  headers.set("x-esm-locale", locale);
  return NextResponse.next({ request: { headers } });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAsset = /\.[a-z0-9]{2,5}$/i.test(pathname);

  if (
    isAsset ||
    STATIC_FILES.has(pathname) ||
    STATIC_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  const first = pathname.split("/").filter(Boolean)[0];

  if (isLocale(first)) {
    const response = forwardWithLocale(request, first);
    response.cookies.set(localeCookie, first, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  if (url.searchParams.has("lang")) url.searchParams.delete("lang");

  const response = NextResponse.redirect(url);
  response.cookies.set(localeCookie, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export default proxy;
