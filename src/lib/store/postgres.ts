import { Pool, type QueryResultRow } from "pg";
import type { EventPatch, EventRow, Lead, LeadPatch, Store } from "./types";

const globalRef = globalThis as unknown as { __esmPool?: Pool };

function pool(): Pool {
  if (!globalRef.__esmPool) {
    globalRef.__esmPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        (process.env.DATABASE_SSL ?? "true") === "false"
          ? false
          : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 10_000,
    });
  }
  return globalRef.__esmPool;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS leads (
  id             TEXT PRIMARY KEY,
  created_at     TIMESTAMPTZ NOT NULL,
  locale         TEXT NOT NULL,
  amount_tier    TEXT NOT NULL,
  amount_value   NUMERIC NOT NULL,
  amount_label   TEXT NOT NULL,
  currency       TEXT NOT NULL DEFAULT 'USD',
  status         TEXT NOT NULL DEFAULT 'new',
  attribution    JSONB NOT NULL DEFAULT '{}'::jsonb,
  crm_lead_id    TEXT,
  crm_synced_at  TIMESTAMPTZ,
  crm_attempts   INTEGER NOT NULL DEFAULT 0,
  page_variant   TEXT
);
CREATE INDEX IF NOT EXISTS leads_created_idx ON leads (created_at DESC);

CREATE TABLE IF NOT EXISTS events (
  id               TEXT PRIMARY KEY,
  lead_id          TEXT REFERENCES leads(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  source           TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending',
  attempts         INTEGER NOT NULL DEFAULT 0,
  last_error       TEXT,
  next_attempt_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL,
  sent_at          TIMESTAMPTZ,
  payload          JSONB NOT NULL,
  response         JSONB
);
CREATE INDEX IF NOT EXISTS events_due_idx ON events (status, next_attempt_at);
`;

let migrated: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  if (!migrated) {
    migrated = pool()
      .query(SCHEMA)
      .then(() => undefined)
      .catch((error) => {
        migrated = null;
        throw error;
      });
  }
  return migrated;
}

function mapLead(row: QueryResultRow): Lead {
  return {
    id: row.id,
    created_at: new Date(row.created_at).toISOString(),
    locale: row.locale,
    amount_tier: row.amount_tier,
    amount_value: Number(row.amount_value),
    amount_label: row.amount_label,
    currency: "USD",
    status: row.status,
    attribution: row.attribution,
    crm_lead_id: row.crm_lead_id,
    crm_synced_at: row.crm_synced_at ? new Date(row.crm_synced_at).toISOString() : null,
    page_variant: row.page_variant,
    crm_attempts: row.crm_attempts ?? 0,
  };
}

function mapEvent(row: QueryResultRow): EventRow {
  return {
    id: row.id,
    lead_id: row.lead_id,
    name: row.name,
    source: row.source,
    status: row.status,
    attempts: row.attempts,
    last_error: row.last_error,
    next_attempt_at: new Date(row.next_attempt_at).toISOString(),
    created_at: new Date(row.created_at).toISOString(),
    sent_at: row.sent_at ? new Date(row.sent_at).toISOString() : null,
    payload: row.payload,
    response: row.response,
  };
}

export class PgStore implements Store {
  async saveLead(lead: Lead): Promise<void> {
    await ensureSchema();
    await pool().query(
      `INSERT INTO leads (id, created_at, locale, amount_tier, amount_value, amount_label, currency, status, attribution, crm_lead_id, crm_synced_at, page_variant)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (id) DO NOTHING`,
      [
        lead.id,
        lead.created_at,
        lead.locale,
        lead.amount_tier,
        lead.amount_value,
        lead.amount_label,
        lead.currency,
        lead.status,
        JSON.stringify(lead.attribution),
        lead.crm_lead_id ?? null,
        lead.crm_synced_at ?? null,
        lead.page_variant ?? null,
        lead.crm_attempts ?? 0,
      ],
    );
  }

  async getLead(id: string): Promise<Lead | null> {
    await ensureSchema();
    const res = await pool().query("SELECT * FROM leads WHERE id = $1", [id]);
    return res.rows[0] ? mapLead(res.rows[0]) : null;
  }

  async updateLead(id: string, patch: LeadPatch): Promise<void> {
    await ensureSchema();
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      fields.push(`${key} = $${i++}`);
      values.push(value);
    }
    if (!fields.length) return;
    values.push(id);
    await pool().query(`UPDATE leads SET ${fields.join(", ")} WHERE id = $${i}`, values);
  }

  async saveEvent(event: EventRow): Promise<void> {
    await ensureSchema();
    await pool().query(
      `INSERT INTO events (id, lead_id, name, source, status, attempts, last_error, next_attempt_at, created_at, sent_at, payload, response)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (id) DO NOTHING`,
      [
        event.id,
        event.lead_id ?? null,
        event.name,
        event.source,
        event.status,
        event.attempts,
        event.last_error ?? null,
        event.next_attempt_at,
        event.created_at,
        event.sent_at ?? null,
        JSON.stringify(event.payload),
        event.response ? JSON.stringify(event.response) : null,
      ],
    );
  }

  async getEvent(id: string): Promise<EventRow | null> {
    await ensureSchema();
    const res = await pool().query("SELECT * FROM events WHERE id = $1", [id]);
    return res.rows[0] ? mapEvent(res.rows[0]) : null;
  }

  async updateEvent(id: string, patch: EventPatch): Promise<void> {
    await ensureSchema();
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      fields.push(`${key} = $${i++}`);
      values.push(
        key === "response" && value !== null ? JSON.stringify(value) : value,
      );
    }
    if (!fields.length) return;
    values.push(id);
    await pool().query(`UPDATE events SET ${fields.join(", ")} WHERE id = $${i}`, values);
  }

  async dueEvents(limit: number): Promise<EventRow[]> {
    await ensureSchema();
    const res = await pool().query(
      `SELECT * FROM events
       WHERE status IN ('pending','failed') AND next_attempt_at <= now() AND attempts < 6
       ORDER BY next_attempt_at ASC LIMIT $1`,
      [limit],
    );
    return res.rows.map(mapEvent);
  }

  async dueCrmLeads(limit: number): Promise<Lead[]> {
    await ensureSchema();
    const res = await pool().query(
      `SELECT * FROM leads WHERE status = 'crm_failed' AND crm_attempts < 6
       ORDER BY created_at ASC LIMIT $1`,
      [limit],
    );
    return res.rows.map(mapLead);
  }

  async listLeads(limit: number): Promise<Lead[]> {
    await ensureSchema();
    const res = await pool().query("SELECT * FROM leads ORDER BY created_at DESC LIMIT $1", [limit]);
    return res.rows.map(mapLead);
  }

  async listEvents(limit: number): Promise<EventRow[]> {
    await ensureSchema();
    const res = await pool().query("SELECT * FROM events ORDER BY created_at DESC LIMIT $1", [limit]);
    return res.rows.map(mapEvent);
  }

  async stats() {
    await ensureSchema();
    const res = await pool().query(
      `SELECT
         (SELECT count(*) FROM leads)::int AS leads,
         (SELECT count(*) FROM events)::int AS events,
         (SELECT count(*) FROM events WHERE status = 'sent')::int AS sent,
         (SELECT count(*) FROM events WHERE status = 'failed')::int AS failed`,
    );
    return res.rows[0] as { leads: number; events: number; sent: number; failed: number };
  }
}
