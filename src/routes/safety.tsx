import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck, IdCard, Flag, Ban, ShieldAlert, Lock } from "lucide-react";
import safetyImg from "@/assets/safety-trust.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/safety")({
  head: () => ({
    meta: [
      { title: "Safety & real accounts — ConnectTogether" },
      { name: "description", content: "How ConnectTogether keeps fake accounts out: email verification, complete profiles, reporting, blocking and automatic pauses." },
      { property: "og:title", content: "Safety on ConnectTogether" },
      { property: "og:description", content: "Email-verified, complete profiles, report & block — real people only." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Safety,
});

const RULES = [
  { icon: MailCheck, title: "Email verification", text: "Every account must confirm a real email address before it can sign in." },
  { icon: IdCard, title: "Complete profile required", text: "Name, a short bio of at least 20 characters and one interest — needed before you can chat, join rooms or teams." },
  { icon: Flag, title: "Report suspicious accounts", text: "Report fake, spam or harassing accounts from any room in two taps." },
  { icon: ShieldAlert, title: "Automatic pause", text: "When three different members report the same account, it's paused and can no longer post." },
  { icon: Ban, title: "Block anyone", text: "Blocked members' messages are hidden from you right away. Unblock anytime from your profile." },
  { icon: Lock, title: "Private rooms stay private", text: "Only people inside a room can read its messages. Your email is never shown to other members." },
];

function Safety() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
      <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-forest">Trust & safety</p>
          <h1 className="text-5xl font-extrabold sm:text-6xl">Real people. Kind conversations.</h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Connecting with strangers only works when everyone is who they say they are. Here's how ConnectTogether keeps it that way.
          </p>
          <Button asChild variant="sage" size="xl" className="mt-8"><Link to="/auth" search={{ mode: "signup" }}>Join as a verified member</Link></Button>
        </div>
        <img src={safetyImg} alt="Two hands shaking above a shield with a check mark" width={1024} height={1024} loading="lazy" className="mx-auto w-full max-w-md rounded-[2.5rem] shadow-lift" />
      </div>
      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {RULES.map((r) => (
          <div key={r.title} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <r.icon className="mb-4 h-7 w-7 text-forest" />
            <h2 className="text-xl font-bold">{r.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
