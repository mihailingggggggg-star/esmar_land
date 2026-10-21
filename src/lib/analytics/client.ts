"use client";

import type { Attribution, UtmParams } from "@/lib/attribution";

const ATTR_KEY = "esm_attr_v1";
const VISITOR_KEY = "esm_vid";
const ATTR_COOKIE = "esm_attr";
const VISITOR_COOKIE = "esm_vid";
const NINETY_DAYS = 90 * 24 * 60 * 60;

type Fbq = ((...args: unknown[]) => void) & {
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  callMethod?: (...args: unknown[]) => void;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
    dataLayer?: unknown[];
    __esmPageViewId?: string;
  }
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function writeCookie(name: string, value: string, maxAgeSeconds = NINETY_DAYS) {
  if (typeof document === "undefined") return;
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

export function getVisitorId(): string {
  if (typeof window === "undefined") return "server";
  const existing = readCookie(VISITOR_COOKIE) || window.localStorage.getItem(VISITOR_KEY);
  if (existing) {
    writeCookie(VISITOR_COOKIE, existing, 365 * 24 * 60 * 60);
    return existing;
  }
  const id = crypto.randomUUID();
  writeCookie(VISITOR_COOKIE, id, 365 * 24 * 60 * 60);
  try {
    window.localStorage.setItem(VISITOR_KEY, id);
  } catch {
    /* storage may be blocked */
  }
  return id;
}

function parseGaClientId(ga?: string): string | undefined {
  if (!ga) return undefined;
  // GA1.1.1234567890.1699999999
  const parts = ga.split(".");
  if (parts.length >= 4) return `${parts[2]}.${parts[3]}`;
  return undefined;
}

function parseGaSessionId(gaSession?: string): string | undefined {
  if (!gaSession) return undefined;
  // GS1.1.1699999999.3.0.1699999999.0.0.0
  const parts = gaSession.split(".");
  if (parts.length >= 3 && /^\d+$/.test(parts[2])) return parts[2];
  return undefined;
}

function detectDevice(): string {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

function collectUtm(params: URLSearchParams): UtmParams {
  const get = (key: string) => params.get(key)?.slice(0, 200) || undefined;
  return {
    source: get("utm_source"),
    medium: get("utm_medium"),
    campaign: get("utm_campaign"),
    content: get("utm_content"),
    term: get("utm_term"),
    id: get("utm_id"),
    source_platform: get("utm_source_platform"),
    creative_format: get("utm_creative_format"),
  };
}

function readStored(): Attribution | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(ATTR_KEY) || readCookie(ATTR_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Attribution;
  } catch {
    return null;
  }
}

function persist(attribution: Attribution) {
  const value = JSON.stringify(attribution);
  try {
    window.localStorage.setItem(ATTR_KEY, value);
  } catch {
    /* ignore */
  }
  writeCookie(ATTR_COOKIE, value);
}

/**
 * First-touch + last-touch attribution capture:
 * - keeps the original utm / fbclid / landing page of the first visit
 * - always refreshes _fbp, _fbc, current url and timestamps
 */
export function captureAttribution(locale: string): Attribution {
  if (typeof window === "undefined") {
    return { utm: {}, landing_url: "", locale, first_seen_at: new Date().toISOString() };
  }

  const params = new URLSearchParams(window.location.search);
  const nowIso = new Date().toISOString();
  const stored = readStored();
  const visitorId = getVisitorId();

  const ga = readCookie("_ga");
  const gaSessionKey = Object.keys(
    Object.fromEntries(
      document.cookie
        .split(";")
        .map((c) => c.trim().split("="))
        .filter(([k]) => k.startsWith("_ga_")),
    ),
  )[0];
  const gaSession = gaSessionKey ? readCookie(gaSessionKey) : undefined;

  const fbclid = params.get("fbclid")?.slice(0, 512) || undefined;
  const cookieFbc = readCookie("_fbc");
  const clickTsFromFbc = cookieFbc?.split(".")[2];
  const fbc =
    cookieFbc ||
    (fbclid
      ? `fb.1.${Date.now()}.${fbclid}`
      : stored?.fbc);

  const fresh: Attribution = {
    fbclid: fbclid ?? stored?.fbclid,
    fbc,
    fbp: readCookie("_fbp") ?? stored?.fbp,
    ctwa_clid: params.get("ctwa_clid")?.slice(0, 512) || stored?.ctwa_clid,
    gclid: params.get("gclid")?.slice(0, 512) || stored?.gclid,
    gbraid: params.get("gbraid")?.slice(0, 512) || stored?.gbraid,
    wbraid: params.get("wbraid")?.slice(0, 512) || stored?.wbraid,
    ttclid: params.get("ttclid")?.slice(0, 512) || stored?.ttclid,
    yclid: params.get("yclid")?.slice(0, 512) || stored?.yclid,
    msclkid: params.get("msclkid")?.slice(0, 512) || stored?.msclkid,
    twclid: params.get("twclid")?.slice(0, 512) || stored?.twclid,
    utm: stored?.utm && Object.values(stored.utm).some(Boolean) ? stored.utm : collectUtm(params),
    referrer: stored?.referrer ?? document.referrer ?? undefined,
    landing_url: stored?.landing_url ?? window.location.href,
    current_url: window.location.href,
    ga_client_id: parseGaClientId(ga) ?? stored?.ga_client_id,
    ga_session_id: parseGaSessionId(gaSession) ?? stored?.ga_session_id,
    visitor_id: visitorId,
    locale,
    browser_lang: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${window.screen.width}x${window.screen.height}`,
    device: detectDevice(),
    first_seen_at: stored?.first_seen_at ?? nowIso,
    last_seen_at: nowIso,
    click_ts: clickTsFromFbc ? Number(clickTsFromFbc) : Math.floor(Date.now() / 1000),
  };

  persist(fresh);
  return fresh;
}

export function getAttribution(locale: string): Attribution {
  return readStored() ?? captureAttribution(locale);
}

/* ------------------------------ Meta Pixel ------------------------------ */

export function initPixel(pixelId: string) {
  if (typeof window === "undefined" || !pixelId || window.fbq?.loaded) return;
  if (!window.fbq) {
    const fbq = function (this: unknown, ...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else (fbq.queue = fbq.queue || []).push(args);
    } as Fbq;
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    window.fbq = fbq;
    window._fbq = fbq;
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }
  window.fbq?.("init", pixelId);
}

export function pixelTrack(
  event: string,
  params?: Record<string, unknown>,
  eventId?: string,
  custom = false,
) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  const options = eventId ? { eventID: eventId } : undefined;
  if (custom) window.fbq("trackCustom", event, params ?? {}, options);
  else window.fbq("track", event, params ?? {}, options);
}

export function pageViewId(): string {
  if (typeof window === "undefined") return "pv-server";
  if (!window.__esmPageViewId) {
    window.__esmPageViewId = `${getVisitorId()}-pv-${Date.now()}`;
  }
  return window.__esmPageViewId;
}

export async function serverTrack(input: {
  name: string;
  eventId: string;
  locale: string;
  attribution?: Attribution;
  params?: Record<string, unknown>;
}): Promise<void> {
  try {
    await fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        name: input.name,
        event_id: input.eventId,
        locale: input.locale,
        attribution: input.attribution ?? getAttribution(input.locale),
        params: input.params,
        source_url: window.location.href,
      }),
    });
  } catch {
    /* analytics must never break the funnel */
  }
}
