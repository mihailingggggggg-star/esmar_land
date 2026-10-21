import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDictionary, isLocale } from "@/i18n";
import { sanitizeAttribution } from "@/lib/attribution";
import { deliverLeadToCrm } from "@/lib/crm";
import { env, hasMetaCapi } from "@/lib/env";
import { newLeadId } from "@/lib/ids";
import { getStore } from "@/lib/store";
import type { Lead } from "@/lib/store/types";
import { trackEvent } from "@/lib/tracking";
import { customDataForLead } from "@/lib/meta/capi";
import { clientCity, clientCountry, clientIp, rateLimit } from "@/lib/rate-limit";
import { whatsappLink } from "@/data/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LeadSchema = z.object({
  amount_tier: z.enum(["s1", "s2", "s3"]),
  locale: z.enum(["ru", "ky"]),
  attribution: z.record(z.string(), z.unknown()).nullish(),
  page_variant: z.string().max(40).optional(),
  email: z.string().max(120).optional(),
  phone: z.string().max(30).optional(),
  /** optional WhatsApp click id coming from a CTWA referral payload */
  ctwa_clid: z.string().max(300).optional(),
});

function pickAmount(locale: "ru" | "ky", tier: "s1" | "s2" | "s3") {
  const dict = getDictionary(locale);
  return dict.amounts.options.find((option) => option.id === tier) ?? dict.amounts.options[0];
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  const limited = rateLimit(`lead:${ip}`, 8, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "retry-after": "60" } },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = LeadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation_failed", issues: parsed.error.issues.map((i) => i.path.join(".")) },
      { status: 422 },
    );
  }

  const data = parsed.data;
  if (!isLocale(data.locale)) {
    return NextResponse.json({ ok: false, error: "invalid_locale" }, { status: 422 });
  }

  const ua = request.headers.get("user-agent")?.slice(0, 512) ?? undefined;
  const attributionRaw = {
    ...(data.attribution ?? {}),
    ...(data.ctwa_clid ? { ctwa_clid: data.ctwa_clid } : {}),
    ip,
    ua,
    country: clientCountry(request.headers),
    city: clientCity(request.headers),
    locale: data.locale,
  };

  const base = sanitizeAttribution(attributionRaw);
  if (!base) {
    return NextResponse.json({ ok: false, error: "attribution_required" }, { status: 422 });
  }

  const option = pickAmount(data.locale, data.amount_tier);
  const dict = getDictionary(data.locale);
  const leadId = newLeadId();
  const createdAt = new Date().toISOString();

  const lead: Lead = {
    id: leadId,
    created_at: createdAt,
    locale: data.locale,
    amount_tier: data.amount_tier,
    amount_value: option.value,
    amount_label: option.range,
    currency: "USD",
    status: "new",
    attribution: base,
    crm_lead_id: null,
    crm_synced_at: null,
    crm_attempts: 0,
    page_variant: data.page_variant,
  };

  const store = getStore();
  await store.saveLead(lead);

  const message = dict.whatsapp.templates[data.amount_tier].replace("{ref}", leadId);
  const url = whatsappLink(message);

  const contactEventId = `${leadId}-contact`;

  // fire-and-forget: the visitor must not wait for CRM/Meta round-trips
  const downstream = async () => {
    await Promise.allSettled([
      deliverLeadToCrm(lead),
      hasMetaCapi()
        ? trackEvent({
            name: "Contact",
            eventId: contactEventId,
            lead,
            source: "site",
            attribution: base,
            eventSourceUrl: base.landing_url,
            phone: data.phone,
            email: data.email,
            customData: customDataForLead(lead, { channel: "whatsapp" }),
          })
        : Promise.resolve(),
      ...(env().SEND_LEAD_ON_SUBMIT === "true" && hasMetaCapi()
        ? [
            trackEvent({
              name: "Lead",
              eventId: `${leadId}-lead`,
              lead,
              source: "site",
              attribution: base,
              eventSourceUrl: base.landing_url,
              customData: customDataForLead(lead, { event_origin: "landing_submit" }),
            }),
          ]
        : []),
    ]);
  };

  try {
    const { after } = await import("next/server");
    after(downstream);
  } catch {
    void downstream();
  }

  return NextResponse.json({
    ok: true,
    lead_id: leadId,
    event_id: contactEventId,
    whatsapp_url: url,
    locale: data.locale,
    amount: { tier: option.id, value: option.value, label: option.range },
    message,
  });
}
