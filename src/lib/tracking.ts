import { env, hasMetaCapi } from "@/lib/env";
import { buildCapiEvent, sendCapiEvent, type CapiEvent } from "@/lib/meta/capi";
import { getStore } from "@/lib/store";
import type { EventRow, Lead } from "@/lib/store/types";
import type { Attribution } from "@/lib/attribution";

function backoff(attempts: number): string {
  const seconds = Math.min(3600, Math.pow(2, attempts) * 30);
  return new Date(Date.now() + seconds * 1000).toISOString();
}

export type TrackInput = {
  name: string;
  eventId: string;
  lead?: Lead | null;
  attribution?: Attribution | null;
  source?: "site" | "crm";
  actionSource?: string;
  eventSourceUrl?: string;
  eventTime?: number;
  phone?: string | null;
  email?: string | null;
  customData?: Record<string, unknown>;
};

/**
 * Writes the event to the outbox, then attempts delivery to Meta CAPI.
 * A failed delivery stays in the outbox with a backoff and is retried by cron.
 */
export async function trackEvent(input: TrackInput): Promise<{ ok: boolean; status: string }> {
  const store = getStore();
  const lead = input.lead ?? null;

  const existing = await store.getEvent(input.eventId);
  if (existing) return { ok: existing.status === "sent", status: `duplicate:${existing.status}` };

  const capiEvent = buildCapiEvent({
    name: input.name,
    eventId: input.eventId,
    leadId: lead?.id,
    attribution: input.attribution,
    eventTime: input.eventTime,
    actionSource: input.actionSource,
    eventSourceUrl: input.eventSourceUrl,
    phone: input.phone,
    email: input.email,
    customData: input.customData,
  });

  const row: EventRow = {
    id: input.eventId,
    lead_id: lead?.id ?? null,
    name: input.name,
    source: input.source ?? "site",
    status: hasMetaCapi() ? "pending" : "skipped",
    attempts: 0,
    next_attempt_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    payload: capiEvent as unknown as Record<string, unknown>,
  };

  await store.saveEvent(row);

  if (!hasMetaCapi()) {
    return { ok: false, status: "skipped:meta_not_configured" };
  }

  const result = await sendCapiEvent(capiEvent);
  const attempts = 1;

  await store.updateEvent(row.id, {
    status: result.ok ? "sent" : "failed",
    attempts,
    last_error: result.error ?? null,
    sent_at: result.ok ? new Date().toISOString() : null,
    next_attempt_at: result.ok ? row.next_attempt_at : backoff(attempts),
    response: result.body ?? null,
  });

  return { ok: result.ok, status: result.ok ? "sent" : "failed" };
}

/** Cron entry point: retries anything the outbox still owes Meta. */
export async function retryDueEvents(limit = 25): Promise<{ sent: number; failed: number }> {
  if (!hasMetaCapi()) return { sent: 0, failed: 0 };
  const store = getStore();
  const due = await store.dueEvents(limit);
  let sent = 0;
  let failed = 0;

  for (const event of due) {
    const result = await sendCapiEvent(event.payload as unknown as CapiEvent);
    const attempts = event.attempts + 1;
    await store.updateEvent(event.id, {
      status: result.ok ? "sent" : "failed",
      attempts,
      last_error: result.error ?? null,
      sent_at: result.ok ? new Date().toISOString() : null,
      next_attempt_at: result.ok ? event.next_attempt_at : backoff(attempts),
      response: result.body ?? null,
    });
    if (result.ok) sent += 1;
    else failed += 1;
  }

  return { sent, failed };
}

export function publicBaseUrl(): string {
  return env().PUBLIC_BASE_URL.replace(/\/$/, "");
}
