import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserAvatar } from "@/components/user-avatar";
import { DOMAINS, MOODS, TONE_BG, type Tone } from "@/lib/domains";
import { PROFILE_RULES, isProfileComplete } from "@/lib/rules";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function ProfileForm({ profile, submitLabel, onSaved }: { profile: Profile; submitLabel: string; onSaved?: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio);
  const [city, setCity] = useState(profile.city);
  const [mood, setMood] = useState(profile.mood || "none");
  const [tone, setTone] = useState(profile.avatar_tone);
  const [interests, setInterests] = useState<string[]>(profile.interests);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(profile.display_name); setBio(profile.bio); setCity(profile.city);
    setMood(profile.mood || "none"); setTone(profile.avatar_tone); setInterests(profile.interests);
  }, [profile]);

  const draft = { display_name: name, bio, interests };
  const complete = isProfileComplete(draft);

  function toggle(slug: string) {
    setInterests((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!complete) { toast.error("Please complete your name, bio and at least one interest."); return; }
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name.trim(), bio: bio.trim(), city: city.trim(), mood: mood === "none" ? "" : mood, avatar_tone: tone, interests, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved");
    await qc.invalidateQueries({ queryKey: ["profile"] });
    onSaved?.();
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center gap-4">
        <UserAvatar name={name || "?"} tone={tone} size="lg" />
        <div>
          <p className="mb-2 text-sm font-medium">Avatar colour</p>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4, 5].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTone(t)}
                aria-label={`Colour ${t + 1}`}
                className={cn("h-7 w-7 rounded-full ring-offset-2 ring-offset-card transition", TONE_BG[(t + 1) as Tone], tone === t && "ring-2 ring-foreground")}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="dn">Display name *</Label>
          <Input id="dn" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="h-11 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">City (optional)</Label>
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} placeholder="e.g. Chennai" className="h-11 rounded-xl" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bio">About you *</Label>
        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={400} rows={4} placeholder="What do you love talking about? What are you planning right now?" className="rounded-xl" />
        <p className={cn("text-xs", bio.trim().length >= PROFILE_RULES.minBio ? "text-forest" : "text-muted-foreground")}>
          {bio.trim().length}/{PROFILE_RULES.minBio} characters minimum
        </p>
      </div>
      <div className="space-y-1.5">
        <Label>Today's mood</Label>
        <Select value={mood} onValueChange={setMood}>
          <SelectTrigger className="h-11 rounded-xl sm:w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Not sharing</SelectItem>
            {MOODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Your interests * <span className="font-normal text-muted-foreground">(pick at least one)</span></Label>
        <div className="flex flex-wrap gap-2">
          {DOMAINS.map((d) => {
            const on = interests.includes(d.slug);
            return (
              <button
                key={d.slug}
                type="button"
                onClick={() => toggle(d.slug)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted",
                )}
              >
                {on ? <Check className="h-3.5 w-3.5" /> : <d.icon className="h-3.5 w-3.5" />} {d.name}
              </button>
            );
          })}
        </div>
      </div>
      <Button type="submit" variant="hero" size="xl" disabled={busy || !complete}>
        {busy && <Loader2 className="animate-spin" />} {submitLabel}
      </Button>
    </form>
  );
}
