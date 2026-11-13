import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "@/components/profile-form";
import { UserAvatar } from "@/components/user-avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useMyProfile } from "@/hooks/use-auth";
import { useToggleBlock } from "@/hooks/use-safety";
import { isProfileComplete } from "@/lib/rules";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My profile — ConnectTogether" },
      { name: "description", content: "Edit your profile, interests and blocked members." },
      { property: "og:title", content: "My profile — ConnectTogether" },
      { property: "og:description", content: "Edit your ConnectTogether profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { userId, session } = useAuth();
  const { data: profile, isLoading } = useMyProfile();
  const unblock = useToggleBlock();

  const activity = useQuery({
    queryKey: ["my-activity", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [rooms, teams, blocks] = await Promise.all([
        supabase.from("room_members").select("room_id", { count: "exact", head: true }).eq("user_id", userId!),
        supabase.from("team_members").select("team_id", { count: "exact", head: true }).eq("user_id", userId!),
        supabase.from("blocks").select("blocked_id, profiles!blocks_blocked_id_fkey(display_name, avatar_tone)").eq("blocker_id", userId!),
      ]);
      return { rooms: rooms.count ?? 0, teams: teams.count ?? 0, blocks: blocks.data ?? [] };
    },
  });

  if (isLoading || !profile) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-[2rem] border border-border bg-card p-6 shadow-soft sm:p-8">
        <h1 className="mb-6 text-3xl font-extrabold">My profile</h1>
        <ProfileForm profile={profile} submitLabel="Save changes" />
      </div>
      <aside className="space-y-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 text-sm font-semibold text-forest">
            <ShieldCheck className="h-4 w-4" /> {isProfileComplete(profile) ? "Verified & complete" : "Profile incomplete"}
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">{session?.user.email} · email confirmed</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl bg-muted p-3"><p className="font-display text-2xl font-bold">{activity.data?.rooms ?? "–"}</p><p className="text-xs text-muted-foreground">Rooms joined</p></div>
            <div className="rounded-2xl bg-muted p-3"><p className="font-display text-2xl font-bold">{activity.data?.teams ?? "–"}</p><p className="text-xs text-muted-foreground">Teams</p></div>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-display font-bold">Blocked members</h2>
          {activity.data?.blocks.length ? (
            <ul className="mt-3 space-y-2">
              {activity.data.blocks.map((b) => (
                <li key={b.blocked_id} className="flex items-center gap-2">
                  <UserAvatar name={b.profiles?.display_name ?? "?"} tone={b.profiles?.avatar_tone ?? 0} size="sm" />
                  <span className="flex-1 truncate text-sm">{b.profiles?.display_name}</span>
                  <Button size="sm" variant="soft" onClick={() => unblock.mutate({ target: b.blocked_id, block: false }, { onSuccess: () => activity.refetch() })}>Unblock</Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">You haven't blocked anyone.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
