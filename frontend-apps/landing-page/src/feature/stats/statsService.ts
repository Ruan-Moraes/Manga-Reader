import type { ApiResponse, PublicStats } from "@manga-reader/types";
import httpClient from "@/shared/service/httpClient";

export async function fetchPublicStats(): Promise<PublicStats> {
  const res = await httpClient.get<ApiResponse<PublicStats>>("/public/stats");
  return res.data.data;
}
