import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export interface PlatformStats {
  members: number;
  connections: number;
  teams: number;
  teamed_up: number;
  messages: number;
  rooms: number;
}
export interface DomainStat {
  domain: string;
  rooms: number;
  people: number;
  teams: number;
}

export const getPlatformStats = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const [p, d] = await Promise.all([sb.rpc("get_platform_stats"), sb.rpc("get_domain_stats")]);
  const row = p.data?.[0];
  const stats: PlatformStats = {
    members: Number(row?.members ?? 0),
    connections: Number(row?.connections ?? 0),
    teams: Number(row?.teams ?? 0),
    teamed_up: Number(row?.teamed_up ?? 0),
    messages: Number(row?.messages ?? 0),
    rooms: Number(row?.rooms ?? 0),
  };
  const domains: DomainStat[] = (d.data ?? []).map((r) => ({
    domain: r.domain,
    rooms: Number(r.rooms),
    people: Number(r.people),
    teams: Number(r.teams),
  }));
  return { stats, domains };
});
