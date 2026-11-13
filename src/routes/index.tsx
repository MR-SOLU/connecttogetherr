import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight, ShieldCheck, Sparkles, Tags, Users, UserRound, Lightbulb, Trophy, SmilePlus, Shuffle,
} from "lucide-react";
import heroImg from "@/assets/hero-connect.jpg";
import { Button } from "@/components/ui/button";
import { DomainPicker } from "@/components/domain-picker";
import { StatsBand } from "@/components/stats-band";
import { statsQuery } from "@/lib/stats-query";
import { DOMAINS, TONE_SOFT } from "@/lib/domains";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ConnectTogether — Find your people, share ideas, build teams" },
      { name: "description", content: "Meet real, verified people who share your interest — travel, sports, music, tech and more. Chat 1-on-1 or in groups and build teams." },
      { property: "og:title", content: "ConnectTogether — Find your people, build teams" },
      { property: "og:description", content: "Pick an interest, meet like-minded people, share perspectives and form a team together." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(statsQuery),
  component: Home,
});

const FEATURES = [
  { icon: Shuffle, title: "Random, but never mismatched", text: "Get matched with new people at random — always inside the same interest domain you picked." },
  { icon: UserRound, title: "1-on-1 or group rooms", text: "Talk privately in a duo room, or join group rooms with up to 50 people." },
  { icon: Tags, title: "Say what you're talking about", text: "Every message carries a dropdown tag — idea, plan, experience, mood or question — so replies stay on point." },
  { icon: Lightbulb, title: "Perspectives board", text: "See each person's ideas side by side and discuss the topic from everyone's point of view." },
  { icon: Trophy, title: "Build a team", text: "Turn a good conversation into a team: set a goal, the spots you need, and let people join." },
  { icon: SmilePlus, title: "Mood-aware", text: "Share how you feel today and find rooms that match your mood." },
];

function Home() {
  const { data } = useSuspenseQuery(statsQuery);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="dotted-bg pointer-events-none absolute inset-0 opacity-40" />
        <div className="bg-glow pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div className="animate-rise space-y-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold shadow-soft">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> {data.stats.members >= 10 ? `${data.stats.members.toLocaleString()} real people` : "Real, verified people"} · {DOMAINS.length} interest domains
            </span>
            <h1 className="text-balance-safe text-5xl font-extrabold leading-[1.02] sm:text-6xl lg:text-7xl">
              Find your people.
              <br />
              <span className="text-primary">Talk it out.</span>
              <br />
              Build it <span className="italic text-forest">together.</span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              ConnectTogether matches you with real people who care about the same things — travel plans, a football team, a side project,
              a book. Share your thoughts, hear every perspective, and turn conversations into teams.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/connect">Start connecting <ArrowRight /></Link>
              </Button>
              <Button asChild variant="soft" size="xl">
                <Link to="/domains">Explore domains</Link>
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-forest" /> Email-verified accounts · Complete profiles · Report & block
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2.5rem] border-4 border-card shadow-lift">
              <img src={heroImg} alt="People from different backgrounds talking together around a table" width={1536} height={1152} className="h-full w-full object-cover" />
            </div>
            <div className="animate-float absolute -left-4 top-8 hidden max-w-[220px] rounded-2xl border border-border bg-card p-3 shadow-lift sm:block">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Travelling · Plan</p>
              <p className="mt-1 text-sm font-medium">"Goa trip in December — who's in? Budget ₹8k each."</p>
            </div>
            <div className="animate-float absolute -bottom-6 right-4 rounded-2xl border border-border bg-card p-3 shadow-lift [animation-delay:1.5s]">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Trophy className="h-4 w-4 text-primary" /> Team formed: Sunday 5-a-side FC
              </p>
              <p className="text-xs text-muted-foreground">7 of 10 spots filled</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live counts */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold sm:text-3xl">Happening on ConnectTogether</h2>
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-forest">
            <span className="h-2 w-2 animate-pulse rounded-full bg-forest" /> Live counts
          </span>
        </div>
        <StatsBand stats={data.stats} />
      </section>

      {/* Domain dropdown */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <div className="mb-8 max-w-2xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">Step one</p>
          <h2 className="text-4xl font-bold sm:text-5xl">What's on your mind today?</h2>
          <p className="mt-3 text-muted-foreground">
            Choose a domain from the dropdown, narrow it down, and we'll take you straight to people talking about exactly that.
          </p>
        </div>
        <DomainPicker domainStats={data.domains} />
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <h2 className="max-w-2xl text-4xl font-bold sm:text-5xl">Everything you need to go from "hi" to "let's do it"</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="group rounded-3xl border border-border bg-card p-6 shadow-soft transition-transform hover:-translate-y-1">
              <span className={cn("mb-5 flex h-11 w-11 items-center justify-center rounded-2xl", TONE_SOFT[((i % 6) + 1) as 1])}>
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stories */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <StoryCard
            tone="sage"
            label="Travelling"
            title="One trip, every traveller's perspective"
            lines={[
              { who: "Meera", tag: "Experience", text: "I did Spiti last year — go in June, roads are open." },
              { who: "Arjun", tag: "Idea", text: "What if we split it: Manali first, then Spiti?" },
              { who: "Sana", tag: "Plan", text: "I'll make a shared budget sheet for the 4 of us." },
            ]}
          />
          <StoryCard
            tone="warm"
            label="Sports"
            title="No team? Build one here."
            lines={[
              { who: "Rahul", tag: "Team", text: "Need 4 more for Sunday football near Koramangala." },
              { who: "Dev", tag: "Plan", text: "I can play defense, joining the team now!" },
              { who: "Kiran", tag: "Question", text: "Is it 7 AM? I'll bring the extra ball." },
            ]}
          />
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-ink p-8 text-ink-foreground sm:p-14">
          <div className="bg-glow pointer-events-none absolute inset-0 opacity-30" />
          <div className="relative grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <ShieldCheck className="mb-4 h-10 w-10 text-tone-2" />
              <h2 className="text-4xl font-bold sm:text-5xl">Real people only.</h2>
              <p className="mt-4 max-w-lg opacity-80">
                Every account confirms its email, fills in a real profile before chatting, and any member can report or block.
                Accounts reported by several people are paused automatically.
              </p>
              <Button asChild variant="hero" size="xl" className="mt-8">
                <Link to="/safety">How we keep it safe <ArrowRight /></Link>
              </Button>
            </div>
            <ul className="space-y-3">
              {["Email verification for every account", "Name, bio & interests required", "Report fake or rude accounts", "Block anyone, instantly", "Auto-pause after repeated reports"].map((t) => (
                <li key={t} className="flex items-center gap-3 rounded-2xl bg-ink-foreground/10 px-4 py-3 text-sm font-medium">
                  <span className="h-2 w-2 rounded-full bg-tone-2" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 pt-24 text-center sm:px-6">
        <Users className="mx-auto mb-4 h-10 w-10 text-primary" />
        <h2 className="text-4xl font-bold sm:text-5xl">Someone out there is thinking the same thing.</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Join free, pick an interest, and start your first conversation in under a minute.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild variant="hero" size="xl">
            <Link to="/auth" search={{ mode: "signup" }}>Create my account</Link>
          </Button>
          <Button asChild variant="soft" size="xl">
            <Link to="/how-it-works">How it works</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function StoryCard({
  tone, label, title, lines,
}: {
  tone: "sage" | "warm";
  label: string;
  title: string;
  lines: { who: string; tag: string; text: string }[];
}) {
  return (
    <div className={cn("rounded-[2rem] p-8 text-primary-foreground shadow-lift", tone === "sage" ? "bg-gradient-sage" : "bg-gradient-warm")}>
      <p className="text-xs font-semibold uppercase tracking-widest opacity-80">{label}</p>
      <h3 className="mt-2 text-3xl font-bold">{title}</h3>
      <div className="mt-6 space-y-3">
        {lines.map((l) => (
          <div key={l.who} className="rounded-2xl bg-card p-4 text-card-foreground">
            <div className="mb-1 flex items-center gap-2 text-xs">
              <span className="font-bold">{l.who}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">{l.tag}</span>
            </div>
            <p className="text-sm">{l.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
