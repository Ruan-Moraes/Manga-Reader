package com.mangareader.application.trending.port;

import java.time.Instant;
import java.util.List;

public interface TrendingReadPort {
    List<TrendView> findLatest(Window window, Ranking ranking, int limit);

    enum Window { DAY, WEEK, MONTH }
    enum Ranking { SCORE, READS, REVIEWS, LIBRARY_ADDS }
    record Metrics(long reads, long libraryAdds, long reviews, long comments, long releases) {}
    record Growth(double reads, double libraryAdds, double reviews, double comments, double releases) {
        public static final Growth EMPTY = new Growth(0, 0, 0, 0, 0);
    }
    record TrendView(String titleId, double score, double growthPercent, Metrics metrics, Growth growth, Instant calculatedAt) {}
}
