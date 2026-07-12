package com.mangareader.presentation.trending.dto;

import java.time.Instant;
import java.util.List;

public record TrendingTitleResponse(
        String id,
        String name,
        String cover,
        String type,
        List<String> genres,
        double score,
        double growthPercent,
        MetricsResponse metrics,
        GrowthResponse growth,
        Instant calculatedAt) {

    public record MetricsResponse(long reads, long libraryAdds, long reviews, long comments, long releases) {}

    public record GrowthResponse(double reads, double libraryAdds, double reviews, double comments, double releases) {}
}
