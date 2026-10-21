import { z } from "zod";

/**
 * Server-side env. Everything is optional so the landing renders and
 * the funnel works out of the box (events are then only logged).
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Meta
  META_PIXEL_ID: z.string().optional(),
  META_CAPI_TOKEN: z.string().optional(),
  META_TEST_EVENT_CODE: z.string().optional(),
  META_GRAPH_VERSION: z.string().default("v23.0"),
  /** override for local testing / proxies */
  META_GRAPH_BASE_URL: z.string().default("https://graph.facebook.com"),
  META_ACTION_SOURCE_SITE: z.string().default("website"),
  META_ACTION_SOURCE_CRM: z.string().default("system_generated"),
  /** fallback: also send a Lead from the landing itself if the CRM cannot call back yet */
  SEND_LEAD_ON_SUBMIT: z.enum(["true", "false"]).default("false"),

  // CRM
  CRM_WEBHOOK_URL: z.string().url().optional(),
  CRM_WEBHOOK_SECRET: z.string().min(8).optional(),
  CRM_LEAD_FIELD_MAP: z.string().optional(),

  // Inbound CRM → CAPI
  CRM_INBOUND_SECRET: z.string().optional(),

  // storage
  DATABASE_URL: z.string().optional(),
  DATABASE_SSL: z.enum(["true", "false"]).default("true"),

  // ops
  ADMIN_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  PUBLIC_BASE_URL: z.string().default("http://localhost:3000"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.warn("[esmar][env] invalid environment, falling back to defaults:", parsed.error.issues);
    cached = schema.parse({ NODE_ENV: process.env.NODE_ENV ?? "development" });
    return cached;
  }
  cached = parsed.data;
  return cached;
}

export const hasMetaCapi = () => Boolean(env().META_PIXEL_ID && env().META_CAPI_TOKEN);
export const hasCrm = () => Boolean(env().CRM_WEBHOOK_URL);
export const hasDatabase = () => Boolean(env().DATABASE_URL);
