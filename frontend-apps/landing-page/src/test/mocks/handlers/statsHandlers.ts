import { http, HttpResponse } from "msw";
import type { PublicStats } from "@manga-reader/types";

export const statsHandlers = [
  http.get("*/api/public/stats", () => {
    const stats: PublicStats = { totalTitles: 250, totalChapters: 4820 };
    return HttpResponse.json({
      data: stats,
      success: true,
      message: null,
      statusCode: 200,
    });
  }),
];
