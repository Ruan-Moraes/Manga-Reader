package com.mangareader.trending.domain;

public record TrendMetrics(long reads, long libraryAdds, long reviews, long comments, long releases) {
    public static final TrendMetrics EMPTY = new TrendMetrics(0, 0, 0, 0, 0);

    public TrendMetrics {
        if (reads < 0 || libraryAdds < 0 || reviews < 0 || comments < 0 || releases < 0) {
            throw new IllegalArgumentException("Trend metrics must not be negative");
        }
    }

    public long interactions() { return reads + libraryAdds + reviews + comments + releases; }
}
