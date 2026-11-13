import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, MessagesSquare, Users, Trophy } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DOMAINS, MOODS, TONE_SOFT, getDomain } from "@/lib/domains";
import type { DomainStat } from "@/lib/stats.functions";
import { cn } from "@/lib/utils";

export function DomainPicker({ domainStats }: { domainStats: DomainStat[] }) {
  const [slug, setSlug] = useState("travel");
  const [subtopic, setSubtopic] = useState<string>("any");
  const [mood, setMood] = useState<string>("any");
  const domain = getDomain(slug)!;
  const stat = domainStats.find((d) => d.domain === slug);
  const Icon = domain.icon;

  return (
    <div className="grid gap-6 rounded-[2rem] border border-border bg-card p-6 shadow-lift sm:p-8 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">I want to talk about</label>
          <Select value={slug} onValueChange={(v) => { setSlug(v); setSubtopic("any"); }}>
            <SelectTrigger className="h-12 rounded-xl text-base"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-80">
              {DOMAINS.map((d) => (
                <SelectItem key={d.slug} value={d.slug}>
                  <span className="flex items-center gap-2"><d.icon className="h-4 w-4" /> {d.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Specifically</label>
            <Select value={subtopic} onValueChange={setSubtopic}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Anything in {domain.name}</SelectItem>
                {domain.subtopics.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">My mood</label>
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any mood</SelectItem>
                {MOODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button asChild variant="hero" size="xl" className="w-full">
          <Link to="/connect" search={{ domain: slug, subtopic: subtopic === "any" ? undefined : subtopic }}>
            Find people in {domain.name} <ArrowRight />
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground">
          You'll only meet people who picked the same domain — no mismatched interests.
        </p>
      </div>

      <div key={slug} className="animate-rise relative overflow-hidden rounded-3xl bg-sand p-6">
        <div className="bg-glow pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative space-y-5">
          <div className="flex items-center gap-3">
            <span className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", TONE_SOFT[domain.tone])}>
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-xl font-bold">{domain.name}</h3>
              <p className="text-sm text-muted-foreground">{domain.tagline}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: MessagesSquare, label: "Rooms", value: stat?.rooms ?? 0 },
              { icon: Users, label: "People", value: stat?.people ?? 0 },
              { icon: Trophy, label: "Teams", value: stat?.teams ?? 0 },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-card/80 p-3 text-center shadow-soft">
                <s.icon className="mx-auto mb-1 h-4 w-4 text-primary" />
                <p className="font-display text-2xl font-bold">{s.value}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {domain.subtopics.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSubtopic(s)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  subtopic === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/70 hover:bg-card",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
