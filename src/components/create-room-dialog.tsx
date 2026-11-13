import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { MOODS, type Domain } from "@/lib/domains";
import { roomCapacity } from "@/lib/rules";
import { joinRoom } from "@/lib/rooms";

export function CreateRoomDialog({ domain, defaultSubtopic, children }: { domain: Domain; defaultSubtopic?: string | undefined; children: ReactNode }) {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subtopic, setSubtopic] = useState<string>(defaultSubtopic ?? domain.subtopics[0] ?? "");
  const [kind, setKind] = useState<"duo" | "group">("group");
  const [size, setSize] = useState(8);
  const [mood, setMood] = useState("none");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) { toast.error("Give your room a title (3+ characters)."); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("rooms")
        .insert({
          domain: domain.slug, subtopic, title: title.trim(), description: description.trim(),
          kind, max_members: roomCapacity(kind, size), mood: mood === "none" ? "" : mood, created_by: userId!,
        })
        .select("id")
        .single();
      if (error) throw error;
      await joinRoom(data.id, userId!);
      setOpen(false);
      navigate({ to: "/rooms/$roomId", params: { roomId: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create room");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Start a {domain.name} room</DialogTitle>
          <DialogDescription>Only people who chose {domain.name} will see it.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="e.g. Planning a Ladakh bike trip" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>What's it about?</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={400} rows={3} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Topic</Label>
              <Select value={subtopic} onValueChange={setSubtopic}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{domain.subtopics.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Mood</Label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any mood</SelectItem>
                  {MOODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as "duo" | "group")}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="duo">1-on-1 (2 people)</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Max people</Label>
              <Input type="number" min={3} max={50} value={kind === "duo" ? 2 : size} disabled={kind === "duo"} onChange={(e) => setSize(Number(e.target.value))} className="rounded-xl" />
            </div>
          </div>
          <Button type="submit" variant="hero" size="xl" className="w-full" disabled={busy}>Create & join</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
