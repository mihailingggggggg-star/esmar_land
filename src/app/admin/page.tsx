import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Esmar · leads", robots: { index: false, follow: false } };

type SearchParams = Promise<{ token?: string }>;

export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  const { token } = await searchParams;
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || token !== expected) notFound();

  const store = getStore();
  const [stats, leads, events] = await Promise.all([
    store.stats(),
    store.listLeads(25),
    store.listEvents(25),
  ]);
  const db = Boolean(process.env.DATABASE_URL);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-bronze">
            Esmar landing
          </p>
          <h1 className="mt-1 font-display text-[28px] font-semibold text-ink">Leads &amp; events</h1>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
            db ? "border-green/30 bg-green/10 text-green" : "border-amber-500/30 bg-amber-50 text-amber-700"
          }`}
        >
          {db ? "Postgres" : "In-memory (ephemeral)"}
        </span>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Leads", value: stats.leads },
          { label: "Events", value: stats.events },
          { label: "Sent to Meta", value: stats.sent },
          { label: "Failed", value: stats.failed },
        ].map((card) => (
          <div key={card.label} className="glass rounded-2xl px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">{card.label}</p>
            <p className="mt-1 font-display text-[24px] font-semibold text-primary">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-7">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Latest leads</h2>
        <div className="glass mt-2 overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[720px] text-left text-[12px]">
            <thead className="border-b border-primary/10 text-[10.5px] uppercase tracking-[0.08em] text-muted">
              <tr>
                <th className="px-3 py-2.5">Lead</th>
                <th className="px-3 py-2.5">Created</th>
                <th className="px-3 py-2.5">Locale</th>
                <th className="px-3 py-2.5">Amount</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Click ids</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-primary/5 last:border-0">
                  <td className="px-3 py-2.5 font-mono text-[11px] text-ink">{lead.id}</td>
                  <td className="px-3 py-2.5 text-muted">
                    {new Date(lead.created_at).toLocaleString("ru-RU")}
                  </td>
                  <td className="px-3 py-2.5 uppercase text-muted">{lead.locale}</td>
                  <td className="px-3 py-2.5 text-muted">
                    {lead.amount_label} <span className="text-muted/60">({lead.amount_value}$)</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="rounded-full bg-primary/5 px-2 py-0.5 text-[10.5px] font-semibold text-primary">
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-muted">
                    {[
                      lead.attribution.fbclid && "fbclid",
                      lead.attribution.fbc && "fbc",
                      lead.attribution.fbp && "fbp",
                      lead.attribution.utm?.source && `utm:${lead.attribution.utm.source}`,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </td>
                </tr>
              ))}
              {!leads.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted">
                    No leads yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-7">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
          Meta CAPI outbox
        </h2>
        <div className="glass mt-2 overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[720px] text-left text-[12px]">
            <thead className="border-b border-primary/10 text-[10.5px] uppercase tracking-[0.08em] text-muted">
              <tr>
                <th className="px-3 py-2.5">Event</th>
                <th className="px-3 py-2.5">Lead</th>
                <th className="px-3 py-2.5">Source</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Attempts</th>
                <th className="px-3 py-2.5">Error</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-primary/5 last:border-0">
                  <td className="px-3 py-2.5 font-semibold text-ink">{event.name}</td>
                  <td className="px-3 py-2.5 font-mono text-[10.5px] text-muted">{event.lead_id ?? "—"}</td>
                  <td className="px-3 py-2.5 text-muted">{event.source}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                        event.status === "sent"
                          ? "bg-green/10 text-green"
                          : event.status === "failed"
                            ? "bg-red-50 text-red-600"
                            : "bg-primary/5 text-primary"
                      }`}
                    >
                      {event.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-muted">{event.attempts}</td>
                  <td className="max-w-[260px] truncate px-3 py-2.5 text-[10.5px] text-red-500">
                    {event.last_error ?? "—"}
                  </td>
                </tr>
              ))}
              {!events.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted">
                    No events yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-6 text-[11px] text-muted">
        Retry endpoint: <code className="font-mono">/api/cron/dispatch</code> with{" "}
        <code className="font-mono">Authorization: Bearer $CRON_SECRET</code>
      </p>
    </div>
  );
}
