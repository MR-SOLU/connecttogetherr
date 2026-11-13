import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { format, isToday } from "date-fns";
import {
  ArrowLeft, Ban, Flag, Loader2, LogOut, MoreVertical, Plus, SendHorizonal, Trophy, User, Users, Lightbulb, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ProfileGate } from "@/components/profile-gate";
import { UserAvatar } from "@/components/user-avatar";
import { ReportDialog } from "@/components/report-dialog";
import { TeamCard, TEAM_SELECT, type TeamRow } from "@/components/team-card";
import { CreateTeamDialog } from "@/components/create-team-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useBlocks, useToggleBlock } from "@/hooks/use-safety";
import { MESSAGE_TOPICS, TOPIC_STYLE, TONE_SOFT, getDomain, topicLabel, type MessageTopic } from "@/lib/domains";
import { joinRoom } from "@/lib/rooms";
import { spotsLeft } from "@/lib/rules";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/rooms/$roomId")({
  head: () => ({
    meta: [
      { title: "Conversation room — ConnectTogether" },
      { name: "description", content: "Talk, share perspectives and build a team with people who share your interest." },
      { property: "og:title", content: "Conversation room — ConnectTogether" },
      { property: "og:description", content: "Live conversation on ConnectTogether." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <ProfileGate>
      <RoomPage />
    </ProfileGate>
  ),
});

const MEMBER_SELECT = "*, room_members(user_id, joined_at, profiles(id, display_name, avatar_tone, bio, interests, city, mood))";
const PERSPECTIVE_TOPICS = new Set(["idea", "plan", "experience", "thought"]);

function RoomPage() {
  const { roomId } = Route.useParams();
  const { userId } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: blocked } = useBlocks();
  const toggleBlock = useToggleBlock();
  const [text, setText] = useState("");
  const [topic, setTopic] = useState<MessageTopic>("thought");
  const [filter, setFilter] = useState<string>("all");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const room = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select(MEMBER_SELECT).eq("id", roomId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const isMember = !!room.data?.room_members.some((m) => m.user_id === userId);

  const messages = useQuery({
    queryKey: ["messages", roomId],
    enabled: isMember,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, profiles(display_name, avatar_tone)")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []).reverse();
    },
  });

  const teams = useQuery({
    queryKey: ["teams", "room", roomId],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select(TEAM_SELECT).eq("room_id", roomId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as TeamRow[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`room-${roomId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` }, () =>
        qc.invalidateQueries({ queryKey: ["messages", roomId] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` }, () =>
        qc.invalidateQueries({ queryKey: ["room", roomId] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "team_members" }, () =>
        qc.invalidateQueries({ queryKey: ["teams", "room", roomId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, qc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.data?.length, filter]);

  const visible = useMemo(
    () => (messages.data ?? []).filter((m) => filter === "all" || m.topic === filter),
    [messages.data, filter],
  );

  const perspectives = useMemo(() => {
    const byUser = new Map<string, { name: string; tone: number; items: { topic: string; content: string }[] }>();
    for (const m of messages.data ?? []) {
      if (!PERSPECTIVE_TOPICS.has(m.topic) || blocked?.has(m.user_id)) continue;
      const entry = byUser.get(m.user_id) ?? { name: m.profiles?.display_name ?? "Member", tone: m.profiles?.avatar_tone ?? 0, items: [] };
      entry.items.push({ topic: m.topic, content: m.content });
      byUser.set(m.user_id, entry);
    }
    return [...byUser.entries()].map(([id, v]) => ({ id, ...v, items: v.items.slice(-3) }));
  }, [messages.data, blocked]);

  async function send() {
    const content = text.trim();
    if (!content) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({ room_id: roomId, user_id: userId!, content: content.slice(0, 2000), topic });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setText("");
    qc.invalidateQueries({ queryKey: ["messages", roomId] });
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  async function join() {
    try {
      await joinRoom(roomId, userId!);
      qc.invalidateQueries({ queryKey: ["room", roomId] });
      qc.invalidateQueries({ queryKey: ["my-rooms"] });
      toast.success("You're in! Say hi 👋");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not join");
    }
  }

  async function leave() {
    const { error } = await supabase.from("room_members").delete().eq("room_id", roomId).eq("user_id", userId!);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["my-rooms"] });
    toast.success("You left the room");
    navigate({ to: "/connect", search: { domain: room.data?.domain } });
  }

  if (room.isLoading) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!room.data) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <h1 className="text-3xl font-bold">Room not found</h1>
        <Button asChild variant="hero" className="mt-6"><Link to="/connect">Back to Connect</Link></Button>
      </div>
    );
  }

  const r = room.data;
  const domain = getDomain(r.domain);
  const left = spotsLeft(r.max_members, r.room_members.length);
  const DIcon = domain?.icon ?? Users;

  const header = (
    <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-4 sm:px-6">
      <Button asChild variant="ghost" size="icon" aria-label="Back"><Link to="/connect" search={{ domain: r.domain }}><ArrowLeft /></Link></Button>
      <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", domain ? TONE_SOFT[domain.tone] : "bg-muted")}>
        <DIcon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-bold">{r.title}</h1>
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span>{domain?.name}</span>·<span>{r.subtopic}</span>·
          <span className="inline-flex items-center gap-1">{r.kind === "duo" ? <User className="h-3 w-3" /> : <Users className="h-3 w-3" />}{r.room_members.length}/{r.max_members}</span>
          {r.mood && <>·<span>{r.mood}</span></>}
        </p>
      </div>
      {isMember && (
        <Button variant="soft" size="sm" onClick={leave}><LogOut /> Leave</Button>
      )}
    </div>
  );

  if (!isMember) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-soft">
          {header}
          <div className="space-y-6 p-6 sm:p-8">
            {r.description && <p className="text-muted-foreground">{r.description}</p>}
            <div>
              <p className="mb-3 text-sm font-semibold">Who's here</p>
              {r.room_members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No one yet — be the first and others will be matched in.</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {r.room_members.map((m) => (
                    <div key={m.user_id} className="flex items-center gap-2 rounded-full bg-muted py-1 pl-1 pr-3 text-sm">
                      <UserAvatar name={m.profiles?.display_name ?? "?"} tone={m.profiles?.avatar_tone ?? 0} size="sm" /> {m.profiles?.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button variant="hero" size="xl" disabled={left === 0} onClick={join}>
              {left === 0 ? "This room is full" : `Join the conversation (${left} spot${left === 1 ? "" : "s"} left)`}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-0 sm:px-6 sm:py-6">
      <div className="grid overflow-hidden border-border bg-card shadow-soft sm:rounded-[2rem] sm:border lg:grid-cols-[1fr_340px]">
        {/* Chat column */}
        <div className="flex h-[calc(100vh-4rem)] min-w-0 flex-col sm:h-[calc(100vh-7rem)]">
          {header}
          <div className="flex gap-1.5 overflow-x-auto border-b border-border px-4 py-2.5 sm:px-6">
            {[{ value: "all", short: "All" }, ...MESSAGE_TOPICS].map((t) => (
              <button
                key={t.value}
                onClick={() => setFilter(t.value)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                  filter === t.value ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {t.short}
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-background/50 px-4 py-5 sm:px-6">
            {messages.isLoading ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
            ) : visible.length === 0 ? (
              <div className="mx-auto max-w-sm py-12 text-center">
                <p className="font-display text-xl font-bold">Start the conversation</p>
                <p className="mt-1 text-sm text-muted-foreground">Pick what you're talking about from the dropdown below — an idea, a plan, your mood — and say hi.</p>
              </div>
            ) : (
              visible.map((m) => {
                const mine = m.user_id === userId;
                if (blocked?.has(m.user_id)) {
                  return (
                    <p key={m.id} className="flex items-center gap-2 text-xs italic text-muted-foreground"><EyeOff className="h-3.5 w-3.5" /> Message from a blocked member hidden</p>
                  );
                }
                const t = new Date(m.created_at);
                return (
                  <div key={m.id} className={cn("flex gap-2.5", mine && "flex-row-reverse")}>
                    <UserAvatar name={m.profiles?.display_name ?? "?"} tone={m.profiles?.avatar_tone ?? 0} size="sm" className="mt-5" />
                    <div className={cn("max-w-[78%] space-y-1", mine && "items-end text-right")}>
                      <div className={cn("flex items-center gap-2 text-xs", mine && "flex-row-reverse")}>
                        <span className="font-semibold">{mine ? "You" : m.profiles?.display_name}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", TOPIC_STYLE[m.topic])}>
                          {topicLabel(m.topic)}
                        </span>
                        <span className="text-muted-foreground">{format(t, isToday(t) ? "HH:mm" : "d MMM, HH:mm")}</span>
                      </div>
                      <div
                        className={cn(
                          "inline-block whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-left text-sm",
                          mine ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm border border-border bg-card",
                        )}
                      >
                        {m.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border bg-card p-3 sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="sm:w-44">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">I'm sharing</p>
                <Select value={topic} onValueChange={(v) => setTopic(v as MessageTopic)}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{MESSAGE_TOPICS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex flex-1 items-end gap-2">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={onKey}
                  maxLength={2000}
                  rows={1}
                  placeholder={`Share ${MESSAGE_TOPICS.find((t) => t.value === topic)?.label.toLowerCase()} about ${r.subtopic || domain?.name}…`}
                  className="max-h-32 min-h-11 resize-none rounded-xl"
                />
                <Button variant="hero" size="icon" className="h-11 w-11 shrink-0" onClick={send} disabled={sending || !text.trim()} aria-label="Send message">
                  {sending ? <Loader2 className="animate-spin" /> : <SendHorizonal />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <aside className="border-t border-border lg:h-[calc(100vh-7rem)] lg:overflow-y-auto lg:border-l lg:border-t-0">
          <Tabs defaultValue="people" className="p-4">
            <TabsList className="grid w-full grid-cols-3 rounded-full">
              <TabsTrigger value="people" className="rounded-full">People</TabsTrigger>
              <TabsTrigger value="ideas" className="rounded-full">Perspectives</TabsTrigger>
              <TabsTrigger value="teams" className="rounded-full">Teams</TabsTrigger>
            </TabsList>

            <TabsContent value="people" className="mt-4 space-y-3">
              {r.room_members.map((m) => {
                const p = m.profiles;
                const isMe = m.user_id === userId;
                const isBlocked = blocked?.has(m.user_id);
                return (
                  <div key={m.user_id} className="rounded-2xl border border-border p-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={p?.display_name ?? "?"} tone={p?.avatar_tone ?? 0} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{p?.display_name}{isMe && " (you)"}</p>
                        <p className="truncate text-xs text-muted-foreground">{[p?.city, p?.mood].filter(Boolean).join(" · ") || "Member"}</p>
                      </div>
                      {!isMe && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={`Actions for ${p?.display_name}`}><MoreVertical /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <ReportDialog targetId={m.user_id} targetName={p?.display_name ?? "member"} roomId={roomId}>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}><Flag /> Report</DropdownMenuItem>
                            </ReportDialog>
                            <DropdownMenuItem onClick={() => toggleBlock.mutate({ target: m.user_id, block: !isBlocked })}>
                              <Ban /> {isBlocked ? "Unblock" : "Block"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    {p?.bio && <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{p.bio}</p>}
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="ideas" className="mt-4 space-y-3">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lightbulb className="h-4 w-4 text-primary" /> Everyone's ideas, plans and experiences on {r.subtopic || domain?.name}, side by side.
              </p>
              {perspectives.length === 0 ? (
                <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">No perspectives yet. Share an idea or plan to start the board.</p>
              ) : (
                perspectives.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-border p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <UserAvatar name={p.name} tone={p.tone} size="sm" />
                      <span className="text-sm font-semibold">{p.id === userId ? "You" : p.name}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {p.items.map((it, i) => (
                        <li key={i} className="text-xs">
                          <span className={cn("mr-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase", TOPIC_STYLE[it.topic])}>{topicLabel(it.topic)}</span>
                          {it.content.length > 140 ? it.content.slice(0, 140) + "…" : it.content}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="teams" className="mt-4 space-y-3">
              <CreateTeamDialog
                roomId={roomId}
                domain={r.domain}
                subtopic={r.subtopic}
                onCreated={(name) =>
                  supabase.from("messages").insert({ room_id: roomId, user_id: userId!, topic: "team", content: `I just formed the team “${name}” — open the Teams tab to join!` }).then(() =>
                    qc.invalidateQueries({ queryKey: ["messages", roomId] }),
                  )
                }
              >
                <Button variant="sage" className="w-full"><Plus /> Form a team from this room</Button>
              </CreateTeamDialog>
              {(teams.data ?? []).length === 0 ? (
                <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                  <Trophy className="mb-1 h-4 w-4 text-primary" /> No teams yet. When the conversation clicks, form one!
                </p>
              ) : (
                teams.data!.map((t) => <TeamCard key={t.id} team={t} compact />)
              )}
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}
