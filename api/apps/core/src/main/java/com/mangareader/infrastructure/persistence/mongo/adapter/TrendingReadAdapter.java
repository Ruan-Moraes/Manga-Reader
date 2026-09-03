package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.time.LocalDate;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import com.mangareader.application.trending.port.TrendingReadPort;
import com.mangareader.application.trending.port.TrendingReadPort.Growth;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class TrendingReadAdapter implements TrendingReadPort {
    private final MongoTemplate mongo;

    @Override
    public List<TrendView> findLatest(Window window, Ranking ranking, int limit) {
        if (limit < 1) return List.of();
        Query latestQuery = new Query().with(org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Order.desc("snapshotDate"),
                org.springframework.data.domain.Sort.Order.desc("calculatedAt"))).limit(1);
        SnapshotDocument latest = mongo.findOne(latestQuery, SnapshotDocument.class, "title_trend_daily");
        if (latest == null) return List.of();
        String scorePath = "scores." + window.name() + "." + rankingPath(ranking);
        Query query = Query.query(Criteria.where("snapshotDate").is(latest.snapshotDate()))
                .with(org.springframework.data.domain.Sort.by(Direction.DESC, scorePath)).limit(Math.min(limit, 100));
        return mongo.find(query, SnapshotDocument.class, "title_trend_daily").stream()
                .filter(document -> hasCompleteScore(document, window.name()))
                .map(document -> map(document, window.name())).toList();
    }

    private static String rankingPath(Ranking ranking) {
        return switch (ranking) {
            case SCORE -> "value";
            case READS -> "metrics.reads";
            case REVIEWS -> "metrics.reviews";
            case LIBRARY_ADDS -> "metrics.libraryAdds";
        };
    }

    private static TrendView map(SnapshotDocument document, String window) {
        ScoreDocument score = document.scores().get(window);
        MetricsDocument metrics = score.metrics();
        GrowthDocument growth = score.growth();
        return new TrendView(document.titleId(), score.value(), score.growthPercent(),
                new Metrics(metrics.reads(), metrics.libraryAdds(), metrics.reviews(), metrics.comments(), metrics.releases()),
                growth == null ? Growth.EMPTY : new Growth(growth.reads(), growth.libraryAdds(), growth.reviews(), growth.comments(), growth.releases()),
                document.calculatedAt());
    }

    private static boolean hasCompleteScore(SnapshotDocument document, String window) {
        if (document.scores() == null) return false;
        ScoreDocument score = document.scores().get(window);
        return score != null && score.metrics() != null;
    }

    record SnapshotDocument(String titleId, LocalDate snapshotDate, Instant calculatedAt,
            Map<String, ScoreDocument> scores) {}
    record ScoreDocument(double value, double growthPercent, MetricsDocument metrics, GrowthDocument growth) {}
    record MetricsDocument(long reads, long libraryAdds, long reviews, long comments, long releases) {}
    record GrowthDocument(double reads, double libraryAdds, double reviews, double comments, double releases) {}
}
