import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { env, hasMetaCapi } from "@/lib/env";
import { hashPhone } from "@/lib/hash";
import { resolveStage, isValidEventName } from "@/lib/meta/events";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { verifySignature } from "@/lib/signature";
import { getStore } from "@/lib/store";
import { trackEvent } from "@/lib/tracking";
import type { LeadStatus } from "@/lib/store/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  lead_id: z.string().min(3).max(64),
  stage: z.string().min(2).max(60),
  /** optional explicit Meta event name, overrides the stage mapping */
  event_name: z.string().min(2).max(40).optional(),
  value: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().max(120).optional(),
  crm_lead_id: z.string().max(120).optional(),
  occurred_at: z.string().max(40).optional(),
  /** idempotency key from the CRM; falls back to lead+stage+time */
  crm_event_id: z.string().max(120).optional(),
  manager: z.string().max(120).optional(),
  amount: z.number().nonnegative().optional(),
});

const STATUS_BY_STAGE: Record<string, LeadStatus> = {
  qualified: "qualified",
  qualification: "qualified",
  meeting_booked: "qualified",
  meeting_held: "qualified",
  contract_signed: "qualified",
  deal_won: "won",
  paid: "won",
  lost: "lost",
  disqualified: "lost",
};

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  if (!rateLimit(`crm:${ip}`, 120, 60_000).ok) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const secret = env().CRM_INBOUND_SECRET ?? env().CRM_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "crm_inbound_not_configured" },
      { status: 503 },
    );
  }

  const raw = await request.text();
  if (raw.length > 16_000) {
    return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 });
  }

  const signature = request.headers.get("x-esmar-signature");
  if (!verifySignature(secret, raw, signature)) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation_failed", issues: parsed.error.issues.map((i) => i.path.join(".")) },
      { status: 422 },
    );
  }

  const data = parsed.data;
  const store = getStore();
  const lead = await store.getLead(data.lead_id);
  if (!lead) {
    return NextResponse.json(
      { ok: false, error: "lead_not_found", lead_id: data.lead_id },
      { status: 404 },
    );
  }

  const rule = resolveStage(data.stage);
  if (!rule) {
    return NextResponse.json({ ok: false, error: "unknown_stage", stage: data.stage }, { status: 422 });
  }

  const eventName = data.event_name && isValidEventName(data.event_name) ? data.event_name : rule.event;
  const occurred = data.occurred_at && !Number.isNaN(Date.parse(data.occurred_at))
    ? Math.floor(Date.parse(data.occurred_at) / 1000)
    : Math.floor(Date.now() / 1000);

  const eventId = data.crm_event_id
    ? `crm-${data.crm_event_id}`.slice(0, 80)
    : `${lead.id}-${data.stage}-${occurred}`;

  const value = data.value ?? (rule.useLeadValue ? lead.amount_value : lead.amount_value);
  const currency = data.currency?.toUpperCase() ?? "USD";

  const result = await trackEvent({
    name: eventName,
    eventId,
    lead,
    source: "crm",
    attribution: lead.attribution,
    actionSource: env().META_ACTION_SOURCE_CRM,
    eventSourceUrl: lead.attribution.landing_url,
    eventTime: occurred,
    phone: data.phone ?? null,
    email: data.email ?? null,
    customData: {
      currency,
      value,
      lead_id: lead.id,
      crm_lead_id: data.crm_lead_id,
      crm_stage: data.stage,
      manager: data.manager,
      locale: lead.locale,
      content_name: lead.amount_label,
      content_ids: [lead.amount_tier],
      content_category: "real_estate_investment",
      event_origin: "crm",
      ...(hashPhone(data.phone) ? { phone_provided: true } : {}),
    },
  });

  const nextStatus = STATUS_BY_STAGE[data.stage];
  await store.updateLead(lead.id, {
    ...(nextStatus ? { status: nextStatus } : {}),
    ...(data.crm_lead_id ? { crm_lead_id: data.crm_lead_id } : {}),
    crm_synced_at: new Date().toISOString(),
  });

  if (!hasMetaCapi()) {
    return NextResponse.json({ ok: true, event_id: eventId, event_name: eventName, capi: "not_configured" });
  }

  return NextResponse.json({
    ok: result.ok,
    event_id: eventId,
    event_name: eventName,
    status: result.status,
  });
}

/** Small helper for CRM builders / Postman without HMAC. Disabled in production. */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  const store = getStore();
  const leads = await store.listLeads(5);
  return NextResponse.json({
    ok: true,
    hint: "POST signed JSON here. Example body: {lead_id, stage:'card_created'}",
    recent_leads: leads.map((l) => ({ lead_id: l.id, created_at: l.created_at, status: l.status })),
  });
}
