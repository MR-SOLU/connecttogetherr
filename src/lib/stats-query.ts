import { queryOptions } from "@tanstack/react-query";
import { getPlatformStats } from "@/lib/stats.functions";

export const statsQuery = queryOptions({
  queryKey: ["platform-stats"],
  queryFn: () => getPlatformStats(),
  staleTime: 30_000,
});
