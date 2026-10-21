/**
 * Signs a JSON payload for /api/crm/lead.
 *   node scripts/sign.mjs '{"lead_id":"ESM-XXXXXX","stage":"card_created"}' [secret] [url]
 */
import { createHmac } from "node:crypto";

const body = process.argv[2] ?? '{"lead_id":"ESM-XXXXXX","stage":"card_created"}';
const secret = process.argv[3] ?? process.env.CRM_INBOUND_SECRET;
const url = process.argv[4] ?? "http://localhost:3000/api/crm/lead";
if (!secret) {
  console.error("secret required (arg 3 or CRM_INBOUND_SECRET)");
  process.exit(1);
}
const ts = Math.floor(Date.now() / 1000);
const sig = createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");

const res = await fetch(url, {
  method: "POST",
  headers: { "content-type": "application/json", "x-esmar-signature": `t=${ts},v1=${sig}` },
  body,
});
console.log(`x-esmar-signature: t=${ts},v1=${sig}`);
console.log(await res.text());
