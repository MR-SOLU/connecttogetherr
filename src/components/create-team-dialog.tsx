import { useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DOMAINS, getDomain } from "@/lib/domains";

export function CreateTeamDialog({
  roomId, domain: fixedDomain, subtopic: fixedSub, children, onCreated,
}: { roomId?: string | undefined; domain?: string | undefined; subtopic?: string | undefined; children: ReactNode; onCreated?: (name: string) => void }) {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState(fixedDomain ?? "sports");
  const [subtopic, setSubtopic] = useState(fixedSub ?? "");
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [needed, setNeeded] = useState(5);
  const [busy, setBusy] = useState(false);
  const d = getDomain(domain)!;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) { toast.error("Give your team a name."); return; }
    setBusy(true);
    const { error } = await supabase.from("teams").insert({
      room_id: roomId ?? null, domain, subtopic, name: name.trim(), goal: goal.trim(),
      needed: Math.min(50, Math.max(2, needed)), created_by: userId!,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Team “${name.trim()}” created!`);
    qc.invalidateQueries({ queryKey: ["teams"] });
    onCreated?.(name.trim());
    setOpen(false);
    setName(""); setGoal("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Form a team</DialogTitle>
          <DialogDescription>Set a goal and how many people you need. Others can join with one tap.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {!fixedDomain && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Domain</Label>
                <Select value={domain} onValueChange={(v) => { setDomain(v); setSubtopic(""); }}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">{DOMAINS.map((x) => <SelectItem key={x.slug} value={x.slug}>{x.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Topic</Label>
                <Select value={subtopic || "none"} onValueChange={(v) => setSubtopic(v === "none" ? "" : v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General</SelectItem>
                    {d.subtopics.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Team name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="e.g. Sunday Strikers FC" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Goal</Label>
            <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={300} rows={3} placeholder="What will this team do together?" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Team size (including you)</Label>
            <Input type="number" min={2} max={50} value={needed} onChange={(e) => setNeeded(Number(e.target.value))} className="rounded-xl" />
          </div>
          <Button type="submit" variant="hero" size="xl" className="w-full" disabled={busy}>Create team</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
