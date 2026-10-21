import { NextResponse } from "next/server";
import { hasCrm, hasDatabase, hasMetaCapi } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "esmar-land",
    time: new Date().toISOString(),
    integrations: {
      meta_capi: hasMetaCapi(),
      crm_webhook: hasCrm(),
      database: hasDatabase(),
    },
  });
}
