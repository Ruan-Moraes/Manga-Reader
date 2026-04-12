import { useQuery } from "@tanstack/react-query";
import { fetchPublicStats } from "../statsService";

const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

export function usePublicStats() {
  return useQuery({
    queryKey: ["public-stats"],
    queryFn: fetchPublicStats,
    staleTime: THIRTY_MINUTES_MS,
    gcTime: ONE_HOUR_MS,
  });
}
