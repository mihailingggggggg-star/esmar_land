/**
 * Local stand-in for the CRM webhook + Meta Graph API, used to verify payloads.
 *   node scripts/mock-integrations.mjs
 * Then run the app with:
 *   CRM_WEBHOOK_URL=http://localhost:3999/crm/lead
 *   META_GRAPH_BASE_URL=http://localhost:3999
 */
import { createServer } from "node:http";
import { appendFileSync, writeFileSync } from "node:fs";

writeFileSync("/tmp/esmar_mock.log", "");
const server = createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    const entry = {
      at: new Date().toISOString(),
      method: req.method,
      url: req.url,
      headers: {
        "x-esmar-signature": req.headers["x-esmar-signature"],
        "x-esmar-event": req.headers["x-esmar-event"],
        "content-type": req.headers["content-type"],
      },
      body: (() => {
        try {
          return JSON.parse(body);
        } catch {
          return body;
        }
      })(),
    };
    appendFileSync("/tmp/esmar_mock.log", JSON.stringify(entry, null, 2) + "\n---\n");
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, events_received: 1, fbtrace_id: "mock" }));
  });
});
server.listen(3999, () => console.log("mock integrations on :3999"));
