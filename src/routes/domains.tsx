import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DOMAINS, TONE_SOFT } from "@/lib/domains";
import { statsQuery } from "@/lib/stats-query";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/domains")({
  head: () => ({
    meta: [
      { title: "Interest domains — ConnectTogether" },
      { name: "description", content: "Travel, sports, music, tech, startups, gaming and more — browse every interest domain and meet people who share it." },
      { property: "og:title", content: "Interest domains — ConnectTogether" },
      { property: "og:description", content: "Browse 18 interest domains and find people to talk and team up with." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(statsQuery),
  component: DomainsPage,
});

function DomainsPage() {
  const { data } = useSuspenseQuery(statsQuery);
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return DOMAINS;
    return DOMAINS.filter((d) => d.name.toLowerCase().includes(s) || d.subtopics.some((t) => t.toLowerCase().includes(s)));
  }, [q]);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">{DOMAINS.length} domains</p>
          <h1 className="text-5xl font-extrabold sm:text-6xl">Pick your world.</h1>
          <p className="mt-3 text-muted-foreground">Each domain has its own rooms, so you only meet people who care about the same thing.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: cricket, coding, yoga…" className="h-11 rounded-full bg-card pl-9" />
        </div>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((d) => {
          const s = data.domains.find((x) => x.domain === d.slug);
          return (
            <Link
              key={d.slug}
              to="/connect"
              search={{ domain: d.slug }}
              className="group flex flex-col rounded-3xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="flex items-start justify-between">
                <span className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", TONE_SOFT[d.tone])}>
                  <d.icon className="h-6 w-6" />
                </span>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <h2 className="mt-5 text-2xl font-bold">{d.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{d.tagline}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {d.subtopics.slice(0, 5).map((t) => (
                  <span key={t} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{t}</span>
                ))}
              </div>
              <div className="mt-auto flex gap-5 border-t border-border pt-4 text-sm">
                <span><b className="font-display">{s?.rooms ?? 0}</b> <span className="text-muted-foreground">rooms</span></span>
                <span><b className="font-display">{s?.people ?? 0}</b> <span className="text-muted-foreground">people</span></span>
                <span><b className="font-display">{s?.teams ?? 0}</b> <span className="text-muted-foreground">teams</span></span>
              </div>
            </Link>
          );
        })}
      </div>
      {list.length === 0 && <p className="py-16 text-center text-muted-foreground">No domain matches "{q}".</p>}
    </div>
  );
}
