package com.mangareader.trending.infrastructure.migration;

import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

@ChangeUnit(id = "V002-create-metric-ranking-indexes", order = "002", author = "mangareader")
public class V002CreateMetricRankingIndexes {
    private final MongoTemplate mongo;
    public V002CreateMetricRankingIndexes(MongoTemplate mongo) { this.mongo = mongo; }

    @Execution
    public void execute() {
        var indexes = mongo.indexOps("title_trend_daily");
        for (String window : java.util.List.of("DAY", "WEEK", "MONTH")) {
            indexes.ensureIndex(metricIndex(window, "reads"));
            indexes.ensureIndex(metricIndex(window, "reviews"));
            indexes.ensureIndex(metricIndex(window, "libraryAdds"));
        }
    }

    private static Index metricIndex(String window, String metric) {
        return new Index().on("snapshotDate", Direction.DESC)
                .on("scores." + window + ".metrics." + metric, Direction.DESC)
                .named("idx_trend_" + window.toLowerCase() + "_" + metric.toLowerCase());
    }

    @RollbackExecution
    public void rollback() {}
}
