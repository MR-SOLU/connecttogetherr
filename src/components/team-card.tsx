import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trophy, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/user-avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getDomain } from "@/lib/domains";
import { spotsLeft } from "@/lib/rules";

export const TEAM_SELECT = "*, team_members(user_id, profiles(display_name, avatar_tone))";

export interface TeamRow {
  id: string;
  name: string;
  goal: string;
  needed: number;
  domain: string;
  subtopic: string;
  room_id: string | null;
  created_by: string;
  team_members: { user_id: string; profiles: { display_name: string; avatar_tone: number } | null }[];
}

export function TeamCard({ team, compact }: { team: TeamRow; compact?: boolean }) {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const isMember = team.team_members.some((m) => m.user_id === userId);
  const left = spotsLeft(team.needed, team.team_members.length);
  const d = getDomain(team.domain);

  async function toggle() {
    if (isMember) {
      const { error } = await supabase.from("team_members").delete().eq("team_id", team.id).eq("user_id", userId!);
      if (error) { toast.error(error.message); return; }
      toast.success(`You left ${team.name}`);
    } else {
      const { error } = await supabase.from("team_members").insert({ team_id: team.id, user_id: userId! });
      if (error) { toast.error(error.message.includes("complete") ? "This team is already complete." : error.message); return; }
      toast.success(`You joined ${team.name}! 🎉`);
    }
    qc.invalidateQueries({ queryKey: ["teams"] });
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {d && <d.icon className="h-3.5 w-3.5" />} {d?.name}{team.subtopic ? ` · ${team.subtopic}` : ""}
          </p>
          <h3 className="mt-1 flex items-center gap-2 text-lg font-bold"><Trophy className="h-4 w-4 shrink-0 text-primary" /> <span className="truncate">{team.name}</span></h3>
        </div>
        {team.created_by !== userId || !isMember ? (
          <Button size="sm" variant={isMember ? "soft" : "hero"} disabled={!isMember && left === 0} onClick={toggle}>
            {isMember ? "Leave" : left === 0 ? "Complete" : "Join team"}
          </Button>
        ) : (
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">Captain</span>
        )}
      </div>
      {team.goal && !compact && <p className="mt-2 text-sm text-muted-foreground">{team.goal}</p>}
      <div className="mt-4 space-y-2">
        <Progress value={(team.team_members.length / team.needed) * 100} className="h-2" />
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {team.team_members.slice(0, 6).map((m) => (
              <UserAvatar key={m.user_id} name={m.profiles?.display_name ?? "?"} tone={m.profiles?.avatar_tone ?? 0} size="sm" />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{team.team_members.length}/{team.needed} members · {left} spot{left === 1 ? "" : "s"} left</span>
        </div>
      </div>
      {!compact && team.room_id && (
        <Link to="/rooms/$roomId" params={{ roomId: team.room_id }} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
          <MessagesSquare className="h-3.5 w-3.5" /> Open the conversation
        </Link>
      )}
    </div>
  );
}
