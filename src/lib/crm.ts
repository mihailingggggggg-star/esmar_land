import { env, hasCrm } from "@/lib/env";
import { signPayload } from "@/lib/signature";
import { getStore } from "@/lib/store";
import { whatsappNumber } from "@/data/site";
import type { Lead } from "@/lib/store/types";

export type CrmPayload = {
  event: "lead.created";
  signature_version: 1;
  lead_id: string;
  created_at: string;
  locale: string;
  amount: {
    tier: string;
    value: number;
    label: string;
    currency: "USD";
  };
  contacts: {
    phone: null;
    email: null;
  };
  click_ids: {
    fbclid?: string;
    fbc?: string;
    fbp?: string;
    ctwa_clid?: string;
    gclid?: string;
    gbraid?: string;
    wbraid?: string;
    ttclid?: string;
    yclid?: string;
    msclkid?: string;
    twclid?: string;
  };
  utm: Record<string, string | undefined>;
  page: {
    landing_url: string;
    current_url?: string;
    referrer?: string;
  };
  meta: {
    pixel_id?: string;
    external_id: string;
    dedupe_event_id: string;
  };
  /** everything we captured, for mapping into custom CRM fields */
  attribution: Record<string, unknown>;
  whatsapp: {
    number: string;
    message_ref: string;
  };
};

export function buildCrmPayload(lead: Lead): CrmPayload {
  const a = lead.attribution;
  return {
    event: "lead.created",
    signature_version: 1,
    lead_id: lead.id,
    created_at: lead.created_at,
    locale: lead.locale,
    amount: {
      tier: lead.amount_tier,
      value: lead.amount_value,
      label: lead.amount_label,
      currency: "USD",
    },
    contacts: { phone: null, email: null },
    click_ids: {
      fbclid: a.fbclid,
      fbc: a.fbc,
      fbp: a.fbp,
      ctwa_clid: a.ctwa_clid,
      gclid: a.gclid,
      gbraid: a.gbraid,
      wbraid: a.wbraid,
      ttclid: a.ttclid,
      yclid: a.yclid,
      msclkid: a.msclkid,
      twclid: a.twclid,
    },
    utm: a.utm as Record<string, string | undefined>,
    page: {
      landing_url: a.landing_url,
      current_url: a.current_url,
      referrer: a.referrer,
    },
    meta: {
      pixel_id: env().META_PIXEL_ID,
      external_id: lead.id,
      dedupe_event_id: `${lead.id}-lead`,
    },
    attribution: a as unknown as Record<string, unknown>,
    whatsapp: {
      number: whatsappNumber,
      message_ref: lead.id,
    },
  };
}

/** POSTs the lead to the CRM webhook, signed with HMAC-SHA256. */
export async function deliverLeadToCrm(lead: Lead): Promise<boolean> {
  if (!hasCrm()) return false;
  const url = env().CRM_WEBHOOK_URL;
  const secret = env().CRM_WEBHOOK_SECRET;
  if (!url || !secret) {
    console.warn("[esmar][crm] CRM_WEBHOOK_URL is set but CRM_WEBHOOK_SECRET is missing");
    return false;
  }

  const body = JSON.stringify(buildCrmPayload(lead));
  const store = getStore();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-esmar-signature": signPayload(secret, body),
        "x-esmar-event": "lead.created",
        "user-agent": "EsmarLanding/1.0 (+crm-webhook)",
      },
      body,
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      await store.updateLead(lead.id, {
        status: "crm_sent",
        crm_synced_at: new Date().toISOString(),
      });
      return true;
    }

    console.error("[esmar][crm] webhook rejected", res.status, (await res.text()).slice(0, 300));
    await store.updateLead(lead.id, {
      status: "crm_failed",
      crm_attempts: (lead.crm_attempts ?? 0) + 1,
    });
    return false;
  } catch (error) {
    console.error("[esmar][crm] webhook error", error);
    await store.updateLead(lead.id, {
      status: "crm_failed",
      crm_attempts: (lead.crm_attempts ?? 0) + 1,
    });
    return false;
  }
}

export async function retryFailedCrmLeads(limit = 10): Promise<{ sent: number; failed: number }> {
  if (!hasCrm()) return { sent: 0, failed: 0 };
  const store = getStore();
  const leads = await store.dueCrmLeads(limit);
  let sent = 0;
  let failed = 0;
  for (const lead of leads) {
    const ok = await deliverLeadToCrm(lead);
    if (ok) sent += 1;
    else failed += 1;
  }
  return { sent, failed };
}
