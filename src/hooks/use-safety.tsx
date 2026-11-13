import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useBlocks() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["blocks", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", userId!);
      if (error) throw error;
      return new Set((data ?? []).map((b) => b.blocked_id));
    },
  });
}

export function useToggleBlock() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ target, block }: { target: string; block: boolean }) => {
      if (block) {
        const { error } = await supabase.from("blocks").insert({ blocker_id: userId!, blocked_id: target });
        if (error && error.code !== "23505") throw error;
      } else {
        const { error } = await supabase.from("blocks").delete().eq("blocker_id", userId!).eq("blocked_id", target);
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => {
      toast.success(v.block ? "Member blocked. Their messages are hidden." : "Member unblocked.");
      qc.invalidateQueries({ queryKey: ["blocks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
