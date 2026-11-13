import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { MailCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import heroImg from "@/assets/hero-connect.jpg";

type Mode = "signin" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: Mode | undefined } => ({
    mode: s["mode"] === "signup" || s["mode"] === "forgot" ? s["mode"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in or join — ConnectTogether" },
      { name: "description", content: "Create your verified ConnectTogether account or sign in to start connecting." },
      { property: "og:title", content: "Join ConnectTogether" },
      { property: "og:description", content: "Create a verified account and meet people who share your interests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const [mode, setMode] = useState<Mode>(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { session, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (search.mode) setMode(search.mode); }, [search.mode]);
  useEffect(() => { if (ready && session) navigate({ to: "/connect", replace: true }); }, [ready, session, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        if (name.trim().length < 2) throw new Error("Please enter your name.");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/onboarding", data: { display_name: name.trim() } },
        });
        if (error) throw error;
        setSentTo(email);
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/connect" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
        if (error) throw error;
        toast.success("Check your inbox for a reset link.");
        setMode("signin");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg.includes("Email not confirmed") ? "Please confirm your email first — check your inbox." : msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center">
      <div className="hidden overflow-hidden rounded-[2.5rem] shadow-lift lg:block">
        <img src={heroImg} alt="" width={1536} height={1152} className="h-full w-full object-cover" />
      </div>
      <div className="mx-auto w-full max-w-md rounded-[2rem] border border-border bg-card p-8 shadow-lift">
        {sentTo ? (
          <div className="space-y-4 text-center">
            <MailCheck className="mx-auto h-12 w-12 text-forest" />
            <h1 className="text-3xl font-bold">Confirm your email</h1>
            <p className="text-muted-foreground">
              We sent a link to <b className="text-foreground">{sentTo}</b>. Click it to verify your account — this keeps ConnectTogether free of fake profiles.
            </p>
            <Button variant="soft" onClick={() => { setSentTo(null); setMode("signin"); }}>Back to sign in</Button>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold">
              {mode === "signup" ? "Join ConnectTogether" : mode === "signin" ? "Welcome back" : "Reset password"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signup" ? "Real people only — you'll confirm your email." : mode === "signin" ? "Sign in to keep the conversation going." : "We'll email you a reset link."}
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Your name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required className="h-11 rounded-xl" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 rounded-xl" />
              </div>
              {mode !== "forgot" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === "signin" && (
                      <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => setMode("forgot")}>Forgot?</button>
                    )}
                  </div>
                  <Input id="password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 rounded-xl" />
                  {mode === "signup" && <p className="text-xs text-muted-foreground">At least 8 characters.</p>}
                </div>
              )}
              <Button type="submit" variant="hero" size="xl" className="w-full" disabled={busy}>
                {busy && <Loader2 className="animate-spin" />}
                {mode === "signup" ? "Create account" : mode === "signin" ? "Sign in" : "Send reset link"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "signup" ? (
                <>Already a member? <button className="font-semibold text-primary hover:underline" onClick={() => setMode("signin")}>Sign in</button></>
              ) : (
                <>New here? <button className="font-semibold text-primary hover:underline" onClick={() => setMode("signup")}>Create an account</button></>
              )}
            </p>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              By joining you agree to keep conversations kind. <Link to="/safety" className="underline">Safety rules</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
