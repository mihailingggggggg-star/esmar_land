import { env, hasMetaCapi } from "@/lib/env";
import { hashEmail, hashExternalId, hashPhone } from "@/lib/hash";
import type { Attribution } from "@/lib/attribution";
import type { Lead } from "@/lib/store/types";

export type CapiUserData = {
  em?: string[];
  ph?: string[];
  external_id?: string[];
  client_ip_address?: string;
  client_user_agent?: string;
  fbc?: string;
  fbp?: string;
  country?: string;
  ctwa_clid?: string;
};

export type CapiEvent = {
  event_name: string;
  event_time: number;
  event_id: string;
  action_source: string;
  event_source_url?: string;
  user_data: CapiUserData;
  custom_data?: Record<string, unknown>;
};

export type CapiResult = {
  ok: boolean;
  status: number;
  body: Record<string, unknown> | null;
  error?: string;
};

export type BuildInput = {
  name: string;
  eventId: string;
  leadId?: string;
  attribution?: Attribution | null;
  eventTime?: number;
  actionSource?: string;
  eventSourceUrl?: string;
  email?: string | null;
  phone?: string | null;
  customData?: Record<string, unknown>;
};

export function buildCapiEvent(input: BuildInput): CapiEvent {
  const a = input.attribution ?? null;
  const user_data: CapiUserData = {};

  const hashedPhone = hashPhone(input.phone);
  if (hashedPhone) user_data.ph = [hashedPhone];

  const hashedEmail = hashEmail(input.email);
  if (hashedEmail) user_data.em = [hashedEmail];

  const externalId = hashExternalId(input.leadId ?? a?.visitor_id);
  if (externalId) user_data.external_id = [externalId];

  if (a?.ip) user_data.client_ip_address = a.ip;
  if (a?.ua) user_data.client_user_agent = a.ua;
  if (a?.fbc) user_data.fbc = a.fbc;
  if (a?.fbp) user_data.fbp = a.fbp;
  if (a?.ctwa_clid) user_data.ctwa_clid = a.ctwa_clid;
  user_data.country = a?.country ?? "kg";

  return {
    event_name: input.name,
    event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    action_source: input.actionSource ?? env().META_ACTION_SOURCE_SITE,
    event_source_url: input.eventSourceUrl ?? a?.landing_url,
    user_data,
    custom_data: input.customData,
  };
}

/** Sends one event to the Conversions API. Never throws. */
export async function sendCapiEvent(event: CapiEvent): Promise<CapiResult> {
  if (!hasMetaCapi()) {
    return { ok: false, status: 0, body: null, error: "meta_not_configured" };
  }

  const { META_PIXEL_ID, META_CAPI_TOKEN, META_GRAPH_VERSION, META_TEST_EVENT_CODE, META_GRAPH_BASE_URL } =
    env();
  const url = `${META_GRAPH_BASE_URL.replace(/\/$/, "")}/${META_GRAPH_VERSION}/${META_PIXEL_ID}/events`;

  const body: Record<string, unknown> = {
    data: [event],
    access_token: META_CAPI_TOKEN,
  };
  if (META_TEST_EVENT_CODE) body.test_event_code = META_TEST_EVENT_CODE;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });

    const parsed = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    const hasError = Boolean(parsed && "error" in parsed) || !res.ok;

    return {
      ok: !hasError,
      status: res.status,
      body: parsed,
      error: hasError ? JSON.stringify(parsed?.error ?? parsed).slice(0, 500) : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: null,
      error: error instanceof Error ? error.message : "network_error",
    };
  }
}

export function customDataForLead(
  lead: Pick<Lead, "id" | "amount_tier" | "amount_value" | "amount_label" | "locale">,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    currency: "USD",
    value: lead.amount_value,
    content_name: lead.amount_label,
    content_category: "real_estate_investment",
    content_ids: [lead.amount_tier],
    lead_id: lead.id,
    locale: lead.locale,
    ...extra,
  };
}
