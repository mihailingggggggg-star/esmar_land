import type { EventPatch, EventRow, Lead, LeadPatch, Store } from "./types";

type Memory = {
  leads: Map<string, Lead>;
  events: Map<string, EventRow>;
};

const globalRef = globalThis as unknown as { __esmStore?: Memory };

function memory(): Memory {
  if (!globalRef.__esmStore) {
    globalRef.__esmStore = { leads: new Map(), events: new Map() };
  }
  return globalRef.__esmStore;
}

/**
 * Process-local fallback used for local dev / previews without DATABASE_URL.
 * On serverless it is per-instance and ephemeral — production must set DATABASE_URL.
 */
export class MemoryStore implements Store {
  async saveLead(lead: Lead): Promise<void> {
    memory().leads.set(lead.id, lead);
  }

  async getLead(id: string): Promise<Lead | null> {
    return memory().leads.get(id) ?? null;
  }

  async updateLead(id: string, patch: LeadPatch): Promise<void> {
    const lead = memory().leads.get(id);
    if (!lead) return;
    memory().leads.set(id, { ...lead, ...patch });
  }

  async saveEvent(event: EventRow): Promise<void> {
    if (memory().events.has(event.id)) return;
    memory().events.set(event.id, event);
  }

  async getEvent(id: string): Promise<EventRow | null> {
    return memory().events.get(id) ?? null;
  }

  async updateEvent(id: string, patch: EventPatch): Promise<void> {
    const event = memory().events.get(id);
    if (!event) return;
    memory().events.set(id, { ...event, ...patch });
  }

  async dueEvents(limit: number): Promise<EventRow[]> {
    const now = Date.now();
    return [...memory().events.values()]
      .filter(
        (e) =>
          (e.status === "pending" || e.status === "failed") &&
          Date.parse(e.next_attempt_at) <= now,
      )
      .slice(0, limit);
  }

  async dueCrmLeads(limit: number): Promise<Lead[]> {
    return [...memory().leads.values()]
      .filter((l) => l.status === "crm_failed" && (l.crm_attempts ?? 0) < 6)
      .slice(0, limit);
  }

  async listLeads(limit: number): Promise<Lead[]> {
    return [...memory().leads.values()]
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .slice(0, limit);
  }

  async listEvents(limit: number): Promise<EventRow[]> {
    return [...memory().events.values()]
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .slice(0, limit);
  }

  async stats() {
    const all = [...memory().events.values()];
    return {
      leads: memory().leads.size,
      events: all.length,
      sent: all.filter((e) => e.status === "sent").length,
      failed: all.filter((e) => e.status === "failed").length,
    };
  }
}
