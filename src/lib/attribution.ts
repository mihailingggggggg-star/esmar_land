export type UtmParams = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  id?: string;
  source_platform?: string;
  creative_format?: string;
};

export type Attribution = {
  /** Meta click id from the ad URL */
  fbclid?: string;
  /** Meta browser cookie / constructed from fbclid: fb.1.<ts>.<fbclid> */
  fbc?: string;
  /** Meta browser id cookie _fbp */
  fbp?: string;
  /** Click-to-WhatsApp click id (when traffic comes from CTWA) */
  ctwa_clid?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  ttclid?: string;
  yclid?: string;
  msclkid?: string;
  twclid?: string;
  utm: UtmParams;
  referrer?: string;
  landing_url: string;
  current_url?: string;
  /** Google Analytics client id / session id, parsed from _ga cookies */
  ga_client_id?: string;
  ga_session_id?: string;
  /** first-party visitor id, used as external_id fallback */
  visitor_id?: string;
  locale: string;
  browser_lang?: string;
  timezone?: string;
  screen?: string;
  device?: string;
  first_seen_at: string;
  last_seen_at?: string;
  /** server-side enrichment */
  ip?: string;
  ua?: string;
  country?: string;
  city?: string;
  /** unix seconds of the ad click, parsed from fbclid */
  click_ts?: number;
};

const MAX = 512;

export function clampString(value: unknown, max = MAX): string | undefined {
  if (typeof value !== "string") return undefined;
  const clean = value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, max);
  return clean.length ? clean : undefined;
}

function safeDecode(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

/** Keeps only known, length-capped keys — protects the CRM/CAPI payloads. */
export function sanitizeAttribution(input: unknown): Attribution | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const utmRaw = (raw.utm ?? {}) as Record<string, unknown>;

  const utm: UtmParams = {
    source: clampString(utmRaw.source, 200),
    medium: clampString(utmRaw.medium, 200),
    campaign: clampString(utmRaw.campaign, 200),
    content: clampString(utmRaw.content, 200),
    term: clampString(utmRaw.term, 200),
    id: clampString(utmRaw.id, 200),
    source_platform: clampString(utmRaw.source_platform, 100),
    creative_format: clampString(utmRaw.creative_format, 100),
  };

  const out: Attribution = {
    fbclid: clampString(raw.fbclid),
    fbc: clampString(raw.fbc, 300),
    fbp: clampString(raw.fbp, 300),
    ctwa_clid: clampString(raw.ctwa_clid),
    gclid: clampString(raw.gclid),
    gbraid: clampString(raw.gbraid),
    wbraid: clampString(raw.wbraid),
    ttclid: clampString(raw.ttclid),
    yclid: clampString(raw.yclid),
    msclkid: clampString(raw.msclkid),
    twclid: clampString(raw.twclid),
    utm,
    referrer: clampString(raw.referrer, 1000),
    landing_url: clampString(raw.landing_url, 1000) ?? "",
    current_url: clampString(raw.current_url, 1000),
    ga_client_id: clampString(raw.ga_client_id, 120),
    ga_session_id: clampString(raw.ga_session_id, 120),
    visitor_id: clampString(raw.visitor_id, 120),
    locale: clampString(raw.locale, 10) ?? "ru",
    browser_lang: clampString(raw.browser_lang, 40),
    timezone: clampString(raw.timezone, 60),
    screen: clampString(raw.screen, 20),
    device: clampString(raw.device, 20),
    first_seen_at: clampString(raw.first_seen_at, 40) ?? new Date().toISOString(),
    last_seen_at: clampString(raw.last_seen_at, 40),
    ip: clampString(raw.ip, 64),
    ua: clampString(raw.ua, 512),
    country: clampString(raw.country, 12),
    city: clampString(raw.city, 80),
    click_ts:
      typeof raw.click_ts === "number" && Number.isFinite(raw.click_ts)
        ? Math.floor(raw.click_ts)
        : undefined,
  };

  // fbc can always be reconstructed from fbclid
  if (!out.fbc && out.fbclid) {
    const ts = out.click_ts ?? Math.floor(Date.now() / 1000);
    out.fbc = `fb.1.${ts * 1000}.${out.fbclid}`;
  }

  if (!out.landing_url) return null;
  return out;
}

/** true when at least one paid click identifier is present */
export function hasPaidClick(a: Attribution | null | undefined): boolean {
  if (!a) return false;
  return Boolean(
    a.fbclid || a.fbc || a.gclid || a.gbraid || a.wbraid || a.ttclid || a.yclid || a.msclkid || a.twclid,
  );
}
