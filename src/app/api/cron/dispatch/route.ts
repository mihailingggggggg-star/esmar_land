import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { retryFailedCrmLeads } from "@/lib/crm";
import { retryDueEvents } from "@/lib/tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: NextRequest): boolean {
  const secret = env().CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const bearer = request.headers.get("authorization");
  const header = request.headers.get("x-cron-secret");
  return bearer === `Bearer ${secret}` || header === secret;
}

export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}

async function run(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const [meta, crm] = await Promise.all([retryDueEvents(25), retryFailedCrmLeads(10)]);
  return NextResponse.json({ ok: true, meta, crm, at: new Date().toISOString() });
}
