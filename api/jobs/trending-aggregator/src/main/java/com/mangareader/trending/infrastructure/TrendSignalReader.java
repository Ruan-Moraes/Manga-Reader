package com.mangareader.trending.infrastructure;

import static org.springframework.data.mongodb.core.aggregation.Aggregation.group;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.match;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.newAggregation;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import com.mangareader.trending.domain.TrendMetrics;
import com.mangareader.trending.application.port.TrendSignalPort;

@Component
public class TrendSignalReader implements TrendSignalPort {
    private static final String READS_COLLECTION = "user_chapter_reads";
    private static final String REVIEWS_COLLECTION = "reviews";
    private static final String COMMENTS_COLLECTION = "comments";
    private static final String CHAPTERS_COLLECTION = "chapters";
    private final MongoTemplate mongo;
    private final JdbcTemplate jdbc;

    public TrendSignalReader(MongoTemplate mongo, JdbcTemplate jdbc) {
        this.mongo = mongo;
        this.jdbc = jdbc;
    }

    @Override
    public Map<String, TrendMetrics> read(LocalDateTime from, LocalDateTime to) {
        Map<String, MutableMetrics> result = new HashMap<>();
        merge(result, grouped(READS_COLLECTION, "titleId", "readAt", from, to), Signal.READS);
        merge(result, grouped(REVIEWS_COLLECTION, "titleId", "createdAt", from, to), Signal.REVIEWS);
        merge(result, grouped(COMMENTS_COLLECTION, "targetId", "createdAt", from, to,
                Criteria.where("targetType").is("TITLE")), Signal.COMMENTS);
        merge(result, groupedReleaseDates(from, to), Signal.RELEASES);
        jdbc.query("SELECT title_id, COUNT(*) FROM user_libraries WHERE saved_at >= ? AND saved_at < ? GROUP BY title_id",
                (org.springframework.jdbc.core.RowCallbackHandler) rs -> result.computeIfAbsent(rs.getString(1), ignored -> new MutableMetrics()).libraryAdds = rs.getLong(2),
                Timestamp.valueOf(from), Timestamp.valueOf(to));
        Map<String, TrendMetrics> immutable = new HashMap<>();
        result.forEach((id, value) -> immutable.put(id, value.toMetrics()));
        return immutable;
    }

    private Map<String, Long> grouped(String collection, String idField, String dateField,
            LocalDateTime from, LocalDateTime to, Criteria... extra) {
        Criteria dates = Criteria.where(dateField).gte(from).lt(to);
        Criteria criteria = extra.length == 0 ? dates : new Criteria().andOperator(dates, extra[0]);
        var rows = mongo.aggregate(newAggregation(match(criteria), group(idField).count().as("count")), collection, CountRow.class);
        Map<String, Long> values = new HashMap<>();
        rows.forEach(row -> putIfValid(values, row));
        return values;
    }

    private Map<String, Long> groupedReleaseDates(LocalDateTime from, LocalDateTime to) {
        Criteria dates = Criteria.where("releaseDate")
                .gte(from.toLocalDate().toString())
                .lt(to.toLocalDate().toString());
        var rows = mongo.aggregate(newAggregation(match(dates), group("titleId").count().as("count")),
                CHAPTERS_COLLECTION, CountRow.class);
        Map<String, Long> values = new HashMap<>();
        rows.forEach(row -> putIfValid(values, row));
        return values;
    }

    private static void putIfValid(Map<String, Long> values, CountRow row) {
        if (row.id() != null && !row.id().isBlank()) {
            values.put(row.id(), row.count());
        }
    }

    private static void merge(Map<String, MutableMetrics> target, Map<String, Long> source, Signal signal) {
        source.forEach((id, count) -> signal.set(target.computeIfAbsent(id, ignored -> new MutableMetrics()), count));
    }

    private record CountRow(String id, long count) {}
    private enum Signal {
        READS { void set(MutableMetrics m, long v) { m.reads = v; } },
        REVIEWS { void set(MutableMetrics m, long v) { m.reviews = v; } },
        COMMENTS { void set(MutableMetrics m, long v) { m.comments = v; } },
        RELEASES { void set(MutableMetrics m, long v) { m.releases = v; } };
        abstract void set(MutableMetrics metrics, long value);
    }
    private static final class MutableMetrics {
        long reads, libraryAdds, reviews, comments, releases;
        TrendMetrics toMetrics() { return new TrendMetrics(reads, libraryAdds, reviews, comments, releases); }
    }
}
