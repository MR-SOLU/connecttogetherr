import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Loader2, Plus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileGate } from "@/components/profile-gate";
import { TeamCard, TEAM_SELECT, type TeamRow } from "@/components/team-card";
import { CreateTeamDialog } from "@/components/create-team-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DOMAINS } from "@/lib/domains";
import { spotsLeft } from "@/lib/rules";

export const Route = createFileRoute("/_authenticated/teams")({
  head: () => ({
    meta: [
      { title: "Teams — ConnectTogether" },
      { name: "description", content: "Join open teams or build your own with people who share your interest." },
      { property: "og:title", content: "Teams — ConnectTogether" },
      { property: "og:description", content: "Find a team or build your own." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProfileGate>
      <TeamsPage />
    </ProfileGate>
  ),
});

function TeamsPage() {
  const { userId } = useAuth();
  const [domain, setDomain] = useState("all");
  const teams = useQuery({
    queryKey: ["teams", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select(TEAM_SELECT).order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data as unknown as TeamRow[];
    },
  });

  const mine = useMemo(() => (teams.data ?? []).filter((t) => t.team_members.some((m) => m.user_id === userId)), [teams.data, userId]);
  const open = useMemo(
    () =>
      (teams.data ?? []).filter(
        (t) => !t.team_members.some((m) => m.user_id === userId) && spotsLeft(t.needed, t.team_members.length) > 0 && (domain === "all" || t.domain === domain),
      ),
    [teams.data, userId, domain],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-primary"><Trophy className="h-4 w-4" /> Teams</p>
          <h1 className="text-5xl font-extrabold">Better together.</h1>
          <p className="mt-2 text-muted-foreground">Can't find people for a sport, trip or project? Join a team — or start one.</p>
        </div>
        <CreateTeamDialog>
          <Button variant="hero" size="xl"><Plus /> Create a team</Button>
        </CreateTeamDialog>
      </div>

      <Tabs defaultValue="open" className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="rounded-full">
            <TabsTrigger value="open" className="rounded-full">Open teams ({open.length})</TabsTrigger>
            <TabsTrigger value="mine" className="rounded-full">My teams ({mine.length})</TabsTrigger>
          </TabsList>
          <Select value={domain} onValueChange={setDomain}>
            <SelectTrigger className="h-10 w-56 rounded-full bg-card"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="all">All domains</SelectItem>
              {DOMAINS.map((d) => <SelectItem key={d.slug} value={d.slug}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {teams.isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <>
            <TabsContent value="open" className="mt-6">
              {open.length === 0 ? <Empty text="No open teams here yet — be the first to create one." /> : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{open.map((t) => <TeamCard key={t.id} team={t} />)}</div>
              )}
            </TabsContent>
            <TabsContent value="mine" className="mt-6">
              {mine.length === 0 ? <Empty text="You haven't joined a team yet." /> : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{mine.map((t) => <TeamCard key={t.id} team={t} />)}</div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">{text}</div>;
}
