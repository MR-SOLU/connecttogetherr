import { Handshake, MessageCircle, Trophy, UserCheck, Users, DoorOpen } from "lucide-react";
import { CountUp } from "@/components/stat-counter";
import type { PlatformStats } from "@/lib/stats.functions";

export function StatsBand({ stats }: { stats: PlatformStats }) {
  const items = [
    { icon: UserCheck, label: "Verified members", value: stats.members },
    { icon: Handshake, label: "People connected", value: stats.connections },
    { icon: Trophy, label: "Teams built", value: stats.teams },
    { icon: Users, label: "Members in teams", value: stats.teamed_up },
    { icon: MessageCircle, label: "Messages shared", value: stats.messages },
    { icon: DoorOpen, label: "Conversation rooms", value: stats.rooms },
  ];
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-3 lg:grid-cols-6">
      {items.map((i) => (
        <div key={i.label} className="bg-card p-5 sm:p-6">
          <i.icon className="mb-3 h-5 w-5 text-primary" />
          <p className="font-display text-3xl font-bold sm:text-4xl"><CountUp value={i.value} /></p>
          <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{i.label}</p>
        </div>
      ))}
    </div>
  );
}
