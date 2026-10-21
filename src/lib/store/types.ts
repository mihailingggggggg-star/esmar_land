import type { Attribution } from "@/lib/attribution";
import type { AmountTierId } from "@/i18n/types";

export type LeadStatus =
  | "new"
  | "crm_sent"
  | "crm_failed"
  | "qualified"
  | "won"
  | "lost";

export type Lead = {
  id: string;
  created_at: string;
  locale: string;
  amount_tier: AmountTierId;
  amount_value: number;
  amount_label: string;
  currency: "USD";
  status: LeadStatus;
  attribution: Attribution & {
    ip?: string;
    ua?: string;
    country?: string;
    city?: string;
  };
  crm_lead_id?: string | null;
  crm_synced_at?: string | null;
  crm_attempts?: number;
  page_variant?: string;
};

export type MetaEventStatus = "pending" | "sent" | "failed" | "skipped";

export type EventRow = {
  id: string;
  lead_id?: string | null;
  name: string;
  source: "site" | "crm";
  status: MetaEventStatus;
  attempts: number;
  last_error?: string | null;
  next_attempt_at: string;
  created_at: string;
  sent_at?: string | null;
  /** full CAPI data block, kept for audit + retries */
  payload: Record<string, unknown>;
  response?: Record<string, unknown> | null;
};

export type LeadPatch = Partial<
  Pick<Lead, "status" | "crm_lead_id" | "crm_synced_at" | "crm_attempts">
>;

export type EventPatch = Partial<
  Pick<EventRow, "status" | "attempts" | "last_error" | "next_attempt_at" | "sent_at" | "response">
>;

export interface Store {
  saveLead(lead: Lead): Promise<void>;
  getLead(id: string): Promise<Lead | null>;
  updateLead(id: string, patch: LeadPatch): Promise<void>;
  saveEvent(event: EventRow): Promise<void>;
  getEvent(id: string): Promise<EventRow | null>;
  updateEvent(id: string, patch: EventPatch): Promise<void>;
  dueEvents(limit: number): Promise<EventRow[]>;
  dueCrmLeads(limit: number): Promise<Lead[]>;
  listLeads(limit: number): Promise<Lead[]>;
  listEvents(limit: number): Promise<EventRow[]>;
  stats(): Promise<{ leads: number; events: number; sent: number; failed: number }>;
}
