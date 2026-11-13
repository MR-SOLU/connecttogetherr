import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Plus, Shuffle, Users, User, MessagesSquare, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ProfileGate } from "@/components/profile-gate";
import { CreateRoomDialog } from "@/components/create-room-dialog";
import { UserAvatar } from "@/components/user-avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useMyProfile } from "@/hooks/use-auth";
import { DOMAINS, MOODS, TONE_SOFT, getDomain } from "@/lib/domains";
import { ROOM_SELECT, joinRoom } from "@/lib/rooms";
import { spotsLeft } from "@/lib/rules";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/connect")({
  validateSearch: (s: Record<string, unknown>): { domain?: string | undefined; subtopic?: string | undefined } => ({
    domain: typeof s["domain"] === "string" ? s["domain"] : undefined,
    subtopic: typeof s["subtopic"] === "string" ? s["subtopic"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Connect — ConnectTogether" },
      { name: "description", content: "Choose an interest domain, find rooms or get matched randomly with like-minded people." },
      { property: "og:title", content: "Connect — ConnectTogether" },
      { property: "og:description", content: "Choose an interest and start talking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProfileGate>
      <ConnectPage />
    </ProfileGate>
  ),
});

function ConnectPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/connect" });
  const { userId } = useAuth();
  const { data: profile } = useMyProfile();
  const slug = getDomain(search.domain)?.slug ?? profile?.interests[0] ?? "travel";
  const domain = getDomain(slug)!;
  const subtopic = search.subtopic && domain.subtopics.includes(search.subtopic) ? search.subtopic : "any";
  const [mood, setMood] = useState("any");
  const [kind, setKind] = useState<"all" | "duo" | "group">("all");
  const [matching, setMatching] = useState(false);

  useEffect(() => setMood("any"), [slug]);

  const rooms = useQuery({
    queryKey: ["rooms", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select(ROOM_SELECT).eq("domain", slug).order("last_activity_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const mine = useQuery({
    queryKey: ["my-rooms", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("room_members").select("room_id, rooms(id, title, domain, kind)").eq("user_id", userId!).order("joined_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const myRoomIds = useMemo(() => new Set((mine.data ?? []).map((m) => m.room_id)), [mine.data]);

  const filtered = useMemo(
    () =>
      (rooms.data ?? []).filter(
        (r) =>
          (subtopic === "any" || r.subtopic === subtopic) &&
          (mood === "any" || r.mood === mood) &&
          (kind === "all" || r.kind === kind),
      ),
    [rooms.data, subtopic, mood, kind],
  );

  function setSearch(next: { domain?: string | undefined; subtopic?: string | undefined }) {
    navigate({ search: { domain: next.domain ?? slug, subtopic: next.subtopic }, replace: true });
  }

  async function open(roomId: string) {
    try {
      if (!myRoomIds.has(roomId)) await joinRoom(roomId, userId!);
      navigate({ to: "/rooms/$roomId", params: { roomId } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not join");
      rooms.refetch();
    }
  }

  async function randomMatch() {
    setMatching(true);
    try {
      const pool = (rooms.data ?? []).filter(
        (r) =>
          (subtopic === "any" || r.subtopic === subtopic) &&
          (kind === "all" || r.kind === kind) &&
          !myRoomIds.has(r.id) &&
          spotsLeft(r.max_members, r.room_members.length) > 0,
      );
      const active = pool.filter((r) => r.room_members.length > 0);
      const pick = (active.length ? active : pool)[Math.floor(Math.random() * (active.length || pool.length))];
      if (pick) {
        toast.success(`Matched you into “${pick.title}”`);
        return await open(pick.id);
      }
      const topic = subtopic === "any" ? (domain.subtopics[Math.floor(Math.random() * domain.subtopics.length)] ?? "General") : subtopic;
      const { data, error } = await supabase
        .from("rooms")
        .insert({
          domain: slug, subtopic: topic, title: `${topic} — open chat`,
          description: `A random ${domain.name} room. Say hi and share what you're thinking about!`,
          kind: kind === "duo" ? "duo" : "group", max_members: kind === "duo" ? 2 : 8, created_by: userId!,
        })
        .select("id")
        .single();
      if (error) throw error;
      await joinRoom(data.id, userId!);
      toast.success("No open rooms right now — we started one. Others will be matched in!");
      navigate({ to: "/rooms/$roomId", params: { roomId: data.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Matching failed");
    } finally {
      setMatching(false);
    }
  }

  const Icon = domain.icon;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">
          {/* Picker */}
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-soft">
            <div className="flex flex-wrap items-center gap-4">
              <span className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", TONE_SOFT[domain.tone])}>
                <Icon className="h-7 w-7" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">You're exploring</p>
                <h1 className="text-3xl font-extrabold">{domain.name}</h1>
              </div>
              <Button variant="hero" size="xl" onClick={randomMatch} disabled={matching || rooms.isLoading}>
                {matching ? <Loader2 className="animate-spin" /> : <Shuffle />} Connect me randomly
              </Button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Domain">
                <Select value={slug} onValueChange={(v) => setSearch({ domain: v })}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-80">
                    {DOMAINS.map((d) => (
                      <SelectItem key={d.slug} value={d.slug}><span className="flex items-center gap-2"><d.icon className="h-4 w-4" />{d.name}</span></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Talking about">
                <Select value={subtopic} onValueChange={(v) => setSearch({ subtopic: v === "any" ? undefined : v })}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">All topics</SelectItem>
                    {domain.subtopics.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Mood">
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any mood</SelectItem>
                    {MOODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Room size">
                <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">1-on-1 & groups</SelectItem>
                    <SelectItem value="duo">1-on-1 only</SelectItem>
                    <SelectItem value="group">Groups only</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>

          {/* Rooms */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{filtered.length} room{filtered.length === 1 ? "" : "s"} in {domain.name}</h2>
            <CreateRoomDialog key={slug} domain={domain} defaultSubtopic={subtopic === "any" ? undefined : subtopic}>
              <Button variant="soft"><Plus /> New room</Button>
            </CreateRoomDialog>
          </div>

          {rooms.isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center">
              <MessagesSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-semibold">No rooms match these filters yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">Start one, or tap “Connect me randomly”.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((r) => {
                const left = spotsLeft(r.max_members, r.room_members.length);
                const joined = myRoomIds.has(r.id);
                return (
                  <div key={r.id} className="flex flex-col rounded-3xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-lift">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-muted px-2.5 py-1 font-semibold">{r.subtopic}</span>
                      <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-semibold text-secondary-foreground">
                        {r.kind === "duo" ? <User className="h-3 w-3" /> : <Users className="h-3 w-3" />} {r.kind === "duo" ? "1-on-1" : "Group"}
                      </span>
                      {r.mood && <span className="rounded-full bg-accent px-2.5 py-1 font-semibold text-accent-foreground">{r.mood}</span>}
                    </div>
                    <h3 className="mt-3 text-lg font-bold leading-snug">{r.title}</h3>
                    {r.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>}
                    <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                      <div className="flex items-center">
                        <div className="flex -space-x-2">
                          {r.room_members.slice(0, 4).map((m) => (
                            <UserAvatar key={m.user_id} name={m.profiles?.display_name ?? "?"} tone={m.profiles?.avatar_tone ?? 0} size="sm" />
                          ))}
                        </div>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {r.room_members.length}/{r.max_members} · {formatDistanceToNow(new Date(r.last_activity_at), { addSuffix: true })}
                        </span>
                      </div>
                      <Button size="sm" variant={joined ? "sage" : left > 0 ? "hero" : "soft"} disabled={!joined && left === 0} onClick={() => open(r.id)}>
                        {joined ? "Open" : left > 0 ? "Join" : "Full"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-display text-lg font-bold">My conversations</h2>
            {mine.data && mine.data.length > 0 ? (
              <ul className="mt-3 space-y-1">
                {mine.data.slice(0, 10).map((m) => {
                  const d = getDomain(m.rooms?.domain);
                  return (
                    <li key={m.room_id}>
                      <Link to="/rooms/$roomId" params={{ roomId: m.room_id }} className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm hover:bg-muted">
                        {d && <d.icon className="h-4 w-4 shrink-0 text-primary" />}
                        <span className="truncate">{m.rooms?.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Rooms you join will show up here.</p>
            )}
          </div>
          <Link to="/teams" className="group block rounded-3xl bg-gradient-sage p-5 text-forest-foreground shadow-soft">
            <p className="font-display text-lg font-bold">Build a team</p>
            <p className="mt-1 text-sm opacity-90">Browse open teams or start your own in any domain.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold">Go to teams <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
