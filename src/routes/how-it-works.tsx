import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MailCheck, ListFilter, MessagesSquare, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MESSAGE_TOPICS } from "@/lib/domains";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — ConnectTogether" },
      { name: "description", content: "Sign up, choose an interest from the dropdown, chat 1-on-1 or in groups, share perspectives and form a team." },
      { property: "og:title", content: "How ConnectTogether works" },
      { property: "og:description", content: "From picking an interest to building a team — in four simple steps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  { icon: MailCheck, title: "Join as a real person", text: "Sign up with your email and confirm it. Then add your name, a short bio and your interests — it takes a minute and keeps fake accounts out." },
  { icon: ListFilter, title: "Choose from the dropdown", text: "Pick a domain like Travelling or Sports, a specific topic like Cricket or Backpacking, and your mood. You'll only see rooms that match." },
  { icon: MessagesSquare, title: "Connect 1-on-1 or in groups", text: "Hit “Connect me randomly” to meet someone new, or join a room you like. Each message is tagged with what you're talking about." },
  { icon: Trophy, title: "Turn talk into a team", text: "When the conversation clicks, create a team with a goal and number of spots. Others join with one tap." },
];

function HowItWorks() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
      <div className="max-w-2xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">How it works</p>
        <h1 className="text-5xl font-extrabold sm:text-6xl">Four steps from stranger to teammate.</h1>
      </div>

      <ol className="mt-14 space-y-6">
        {STEPS.map((s, i) => (
          <li key={s.title} className="grid gap-6 rounded-[2rem] border border-border bg-card p-6 shadow-soft sm:grid-cols-[auto_1fr] sm:p-8">
            <div className="flex items-center gap-4 sm:flex-col sm:items-start">
              <span className="font-display text-6xl font-extrabold text-primary/25">0{i + 1}</span>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                <s.icon className="h-6 w-6" />
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">{s.title}</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">{s.text}</p>
              {i === 2 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {MESSAGE_TOPICS.map((t) => (
                    <span key={t.value} className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">{t.label}</span>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-14 flex flex-wrap justify-center gap-3">
        <Button asChild variant="hero" size="xl"><Link to="/connect">Try it now <ArrowRight /></Link></Button>
        <Button asChild variant="soft" size="xl"><Link to="/domains">Browse domains</Link></Button>
      </div>
    </div>
  );
}
