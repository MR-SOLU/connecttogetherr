import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — ConnectTogether" },
      { name: "description", content: "Choose a new password for your ConnectTogether account." },
      { property: "og:title", content: "Reset password — ConnectTogether" },
      { property: "og:description", content: "Choose a new password for your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated.");
    navigate({ to: "/connect" });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <form onSubmit={submit} className="space-y-4 rounded-[2rem] border border-border bg-card p-8 shadow-lift">
        <h1 className="text-3xl font-bold">Set a new password</h1>
        <div className="space-y-1.5">
          <Label htmlFor="pw">New password</Label>
          <Input id="pw" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 rounded-xl" />
        </div>
        <Button type="submit" variant="hero" size="xl" className="w-full" disabled={busy}>Update password</Button>
      </form>
    </div>
  );
}
