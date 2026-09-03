package com.mangareader.trending.domain;

public class TrendScoreCalculator {
    private final double reads, libraryAdds, reviews, comments, releases;

    public TrendScoreCalculator(double reads, double libraryAdds, double reviews, double comments, double releases) {
        validateWeight(reads);
        validateWeight(libraryAdds);
        validateWeight(reviews);
        validateWeight(comments);
        validateWeight(releases);
        double sum = reads + libraryAdds + reviews + comments + releases;
        if (Math.abs(sum - 1) > 0.0001) throw new IllegalArgumentException("Trending weights must sum to 1");
        this.reads = reads; this.libraryAdds = libraryAdds; this.reviews = reviews; this.comments = comments; this.releases = releases;
    }

    public TrendScore calculate(TrendMetrics current, TrendMetrics previous) {
        double volume = reads * Math.log1p(current.reads()) + libraryAdds * Math.log1p(current.libraryAdds())
                + reviews * Math.log1p(current.reviews()) + comments * Math.log1p(current.comments())
                + releases * Math.log1p(current.releases());
        double growth = previous.interactions() == 0 ? (current.interactions() == 0 ? 0 : 1)
                : (current.interactions() - previous.interactions()) / (double) previous.interactions();
        double confidence = Math.min(1, current.interactions() / 20.0);
        double multiplier = 1 + Math.max(-0.5, Math.min(3, growth)) * confidence;
        return new TrendScore(round(volume * multiplier * 100), round(growth * 100), current,
                new TrendGrowth(percent(current.reads(), previous.reads()),
                        percent(current.libraryAdds(), previous.libraryAdds()),
                        percent(current.reviews(), previous.reviews()),
                        percent(current.comments(), previous.comments()),
                        percent(current.releases(), previous.releases())));
    }

    private static double percent(long current, long previous) {
        if (previous == 0) return current == 0 ? 0 : 100;
        return round((current - previous) * 100.0 / previous);
    }

    private static void validateWeight(double weight) {
        if (!Double.isFinite(weight) || weight < 0) {
            throw new IllegalArgumentException("Trending weights must be finite and non-negative");
        }
    }

    private static double round(double value) { return Math.round(value * 100.0) / 100.0; }
}
