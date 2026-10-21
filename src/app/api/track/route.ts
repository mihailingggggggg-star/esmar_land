import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { sanitizeAttribution } from "@/lib/attribution";
import { hasMetaCapi } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { trackEvent } from "@/lib/tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "PageView",
  "ViewContent",
  "SelectAmount",
  "Contact",
  "InitiateCheckout",
]);

const TrackSchema = z.object({
  name: z.string().max(40),
  event_id: z.string().min(6).max(80),
  attribution: z.record(z.string(), z.unknown()).nullish(),
  params: z.record(z.string(), z.unknown()).optional(),
  locale: z.enum(["ru", "ky"]).default("ru"),
  source_url: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  if (!rateLimit(`track:${ip}`, 60, 60_000).ok) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = TrackSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation_failed" }, { status: 422 });
  }

  const { name, event_id, attribution, params, locale, source_url } = parsed.data;
  if (!ALLOWED.has(name)) {
    return NextResponse.json({ ok: false, error: "event_not_allowed" }, { status: 422 });
  }

  const base = sanitizeAttribution({
    ...(attribution ?? {}),
    ip,
    ua: request.headers.get("user-agent")?.slice(0, 512),
    locale,
  });

  if (!base) {
    return NextResponse.json({ ok: false, error: "attribution_required" }, { status: 422 });
  }

  if (!hasMetaCapi()) {
    return NextResponse.json({ ok: true, skipped: "meta_not_configured" });
  }

  const result = await trackEvent({
    name,
    eventId: event_id,
    source: "site",
    attribution: base,
    eventSourceUrl: source_url ?? base.landing_url,
    customData: { ...(params ?? {}), locale },
  });

  return NextResponse.json({ ok: result.ok, status: result.status });
}
