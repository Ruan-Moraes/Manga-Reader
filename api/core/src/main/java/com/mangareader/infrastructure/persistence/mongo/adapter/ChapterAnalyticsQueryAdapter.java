package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import com.mangareader.application.manga.port.ChapterAnalyticsQueryPort;
import com.mangareader.domain.analytics.entity.BehaviorEventType;
import com.mangareader.domain.analytics.entity.BehaviorPlatform;
import com.mangareader.domain.user.entity.UserChapterRead;
import com.mangareader.infrastructure.persistence.mongo.document.BehaviorEventDocument;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ChapterAnalyticsQueryAdapter implements ChapterAnalyticsQueryPort {
    private static final Set<BehaviorEventType> SESSION_TYPES = Set.of(
            BehaviorEventType.CHAPTER_SESSION_STARTED, BehaviorEventType.CHAPTER_SESSION_COMPLETED,
            BehaviorEventType.CHAPTER_SESSION_PARTIAL, BehaviorEventType.CHAPTER_PROGRESS_CHECKPOINT);
    private final MongoTemplate mongo;

    @Override
    public Snapshot summarize(String titleId, String chapterNumber, Instant publishedAt, Filter filter) {
        List<UserChapterRead> reads = readDocuments(titleId, chapterNumber, filter);
        List<BehaviorEventDocument> events = behaviorDocuments(titleId, chapterNumber, filter);
        return summarize(reads, events, publishedAt);
    }

    @Override
    public Map<ChapterKey, Snapshot> summarizeMany(List<SummaryRequest> chapters, Filter filter) {
        if (chapters == null || chapters.isEmpty()) return Map.of();
        Map<ChapterKey, List<UserChapterRead>> reads = readDocuments(chapters, filter).stream()
                .collect(Collectors.groupingBy(read -> new ChapterKey(read.getTitleId(), read.getChapterNumber())));
        Map<ChapterKey, List<BehaviorEventDocument>> events = behaviorDocuments(chapters, filter).stream()
                .collect(Collectors.groupingBy(event -> new ChapterKey(event.titleId(), event.chapterNumber())));
        var snapshots = new LinkedHashMap<ChapterKey, Snapshot>();
        for (SummaryRequest chapter : chapters) {
            snapshots.put(chapter.key(), summarize(
                    reads.getOrDefault(chapter.key(), List.of()),
                    events.getOrDefault(chapter.key(), List.of()),
                    chapter.publishedAt()));
        }
        return snapshots;
    }

    private Snapshot summarize(List<UserChapterRead> reads, List<BehaviorEventDocument> events,
            Instant publishedAt) {
        List<BehaviorEventDocument> starts = events.stream()
                .filter(event -> event.type() == BehaviorEventType.CHAPTER_SESSION_STARTED).toList();
        List<BehaviorEventDocument> completed = events.stream()
                .filter(event -> event.type() == BehaviorEventType.CHAPTER_SESSION_COMPLETED).toList();
        List<BehaviorEventDocument> partial = events.stream()
                .filter(event -> event.type() == BehaviorEventType.CHAPTER_SESSION_PARTIAL).toList();
        List<BehaviorEventDocument> progress = events.stream()
                .filter(event -> event.progressPercent() != null).toList();

        long total = starts.isEmpty() ? reads.size() : starts.size();
        Set<String> readers = (starts.isEmpty() ? reads.stream().map(UserChapterRead::getUserId)
                : starts.stream().map(event -> event.userId() != null ? event.userId() : event.sessionId()))
                .filter(Objects::nonNull).collect(Collectors.toSet());
        double averageDwell = events.stream().map(BehaviorEventDocument::dwellMillis).filter(Objects::nonNull)
                .mapToLong(Long::longValue).average().orElse(0) / 1000d;
        double completion = total == 0 ? 0 : Math.min(1d, (double) completed.size() / total);
        double avgProgress = progress.stream().map(BehaviorEventDocument::progressPercent)
                .mapToInt(Integer::intValue).average().orElse(completion * 100) / 100d;
        double avgAbandon = partial.stream().map(BehaviorEventDocument::progressPercent).filter(Objects::nonNull)
                .mapToInt(Integer::intValue).average().orElse(0);
        Map<String, Long> byPlatform = count(events, this::platform);
        Map<String, Long> byDevice = count(events, this::device);
        Instant first = timestamps(reads, events).stream().min(Instant::compareTo).orElse(null);
        Instant last = timestamps(reads, events).stream().max(Instant::compareTo).orElse(null);
        long first24 = publishedAt == null ? 0 : timestamps(reads, events).stream()
                .filter(at -> !at.isBefore(publishedAt) && at.isBefore(publishedAt.plus(24, ChronoUnit.HOURS))).count();
        long first7 = publishedAt == null ? 0 : timestamps(reads, events).stream()
                .filter(at -> !at.isBefore(publishedAt) && at.isBefore(publishedAt.plus(7, ChronoUnit.DAYS))).count();
        return new Snapshot(total, readers.size(), averageDwell, completion, avgProgress, partial.size(),
                avgAbandon, withDefaults(byDevice, "mobile", "desktop", "tablet"),
                withDefaults(byPlatform, "web", "android", "ios"), first, last, first24, first7);
    }

    @Override
    public List<SeriesPoint> series(String titleId, String chapterNumber, Filter filter, String granularity) {
        List<Instant> values = timestamps(readDocuments(titleId, chapterNumber, filter),
                behaviorDocuments(titleId, chapterNumber, filter).stream()
                        .filter(event -> event.type() == BehaviorEventType.CHAPTER_SESSION_STARTED).toList());
        return values.stream().collect(Collectors.groupingBy(at -> bucket(at, granularity), LinkedHashMap::new, Collectors.counting()))
                .entrySet().stream().sorted(Map.Entry.comparingByKey())
                .map(entry -> new SeriesPoint(entry.getKey(), entry.getValue())).toList();
    }

    private List<UserChapterRead> readDocuments(String titleId, String chapterNumber, Filter filter) {
        var conditions = new java.util.ArrayList<Criteria>();
        conditions.add(Criteria.where("titleId").is(titleId));
        conditions.add(Criteria.where("chapterNumber").is(chapterNumber));
        Criteria time = Criteria.where("readAt");
        if (filter.from() != null) time = time.gte(LocalDateTime.ofInstant(filter.from(), ZoneOffset.UTC));
        if (filter.to() != null) time = time.lte(LocalDateTime.ofInstant(filter.to(), ZoneOffset.UTC));
        if (filter.from() != null || filter.to() != null) conditions.add(time);
        return mongo.find(new Query(new Criteria().andOperator(conditions.toArray(Criteria[]::new))), UserChapterRead.class);
    }

    private List<UserChapterRead> readDocuments(List<SummaryRequest> chapters, Filter filter) {
        var conditions = new java.util.ArrayList<Criteria>();
        conditions.add(chapterPairs(chapters));
        Criteria time = Criteria.where("readAt");
        if (filter.from() != null) time = time.gte(LocalDateTime.ofInstant(filter.from(), ZoneOffset.UTC));
        if (filter.to() != null) time = time.lte(LocalDateTime.ofInstant(filter.to(), ZoneOffset.UTC));
        if (filter.from() != null || filter.to() != null) conditions.add(time);
        return mongo.find(new Query(new Criteria().andOperator(conditions.toArray(Criteria[]::new))), UserChapterRead.class);
    }

    private List<BehaviorEventDocument> behaviorDocuments(String titleId, String chapterNumber, Filter filter) {
        var conditions = new java.util.ArrayList<Criteria>();
        conditions.add(Criteria.where("titleId").is(titleId));
        conditions.add(Criteria.where("chapterNumber").is(chapterNumber));
        conditions.add(Criteria.where("type").in(SESSION_TYPES));
        Criteria time = Criteria.where("occurredAt");
        if (filter.from() != null) time = time.gte(filter.from());
        if (filter.to() != null) time = time.lte(filter.to());
        if (filter.from() != null || filter.to() != null) conditions.add(time);
        if (filter.platform() != null && !"all".equalsIgnoreCase(filter.platform())) {
            conditions.add(Criteria.where("platform").is(BehaviorPlatform.valueOf(filter.platform().toUpperCase(Locale.ROOT))));
        }
        List<BehaviorEventDocument> events = mongo.find(
                new Query(new Criteria().andOperator(conditions.toArray(Criteria[]::new))), BehaviorEventDocument.class);
        if (filter.device() == null || "all".equalsIgnoreCase(filter.device())) return events;
        return events.stream().filter(event -> filter.device().equalsIgnoreCase(device(event))).toList();
    }

    private List<BehaviorEventDocument> behaviorDocuments(List<SummaryRequest> chapters, Filter filter) {
        var conditions = new java.util.ArrayList<Criteria>();
        conditions.add(chapterPairs(chapters));
        conditions.add(Criteria.where("type").in(SESSION_TYPES));
        Criteria time = Criteria.where("occurredAt");
        if (filter.from() != null) time = time.gte(filter.from());
        if (filter.to() != null) time = time.lte(filter.to());
        if (filter.from() != null || filter.to() != null) conditions.add(time);
        if (filter.platform() != null && !"all".equalsIgnoreCase(filter.platform())) {
            conditions.add(Criteria.where("platform").is(
                    BehaviorPlatform.valueOf(filter.platform().toUpperCase(Locale.ROOT))));
        }
        List<BehaviorEventDocument> events = mongo.find(
                new Query(new Criteria().andOperator(conditions.toArray(Criteria[]::new))),
                BehaviorEventDocument.class);
        if (filter.device() == null || "all".equalsIgnoreCase(filter.device())) return events;
        return events.stream().filter(event -> filter.device().equalsIgnoreCase(device(event))).toList();
    }

    private Criteria chapterPairs(List<SummaryRequest> chapters) {
        Criteria[] pairs = chapters.stream()
                .map(chapter -> new Criteria().andOperator(
                        Criteria.where("titleId").is(chapter.titleId()),
                        Criteria.where("chapterNumber").is(chapter.chapterNumber())))
                .toArray(Criteria[]::new);
        return new Criteria().orOperator(pairs);
    }

    private List<Instant> timestamps(List<UserChapterRead> reads, List<BehaviorEventDocument> events) {
        var result = new java.util.ArrayList<Instant>();
        reads.stream().map(UserChapterRead::getReadAt).filter(Objects::nonNull)
                .map(value -> value.toInstant(ZoneOffset.UTC)).forEach(result::add);
        events.stream().map(BehaviorEventDocument::occurredAt).filter(Objects::nonNull).forEach(result::add);
        return result;
    }

    private Map<String, Long> count(List<BehaviorEventDocument> events,
            java.util.function.Function<BehaviorEventDocument, String> classifier) {
        return events.stream().filter(event -> event.type() == BehaviorEventType.CHAPTER_SESSION_STARTED)
                .collect(Collectors.groupingBy(classifier, Collectors.counting()));
    }

    private String platform(BehaviorEventDocument event) {
        return event.platform() == null ? "web" : event.platform().name().toLowerCase(Locale.ROOT);
    }

    private String device(BehaviorEventDocument event) {
        return event.platform() == BehaviorPlatform.ANDROID || event.platform() == BehaviorPlatform.IOS ? "mobile" : "desktop";
    }

    private Map<String, Long> withDefaults(Map<String, Long> source, String... keys) {
        var result = new LinkedHashMap<String, Long>();
        for (String key : keys) result.put(key, source.getOrDefault(key, 0L));
        return result;
    }

    private String bucket(Instant instant, String granularity) {
        LocalDate day = instant.atZone(ZoneOffset.UTC).toLocalDate();
        return switch (granularity == null ? "day" : granularity.toLowerCase(Locale.ROOT)) {
            case "week" -> day.with(java.time.DayOfWeek.MONDAY).toString();
            case "month" -> day.with(TemporalAdjusters.firstDayOfMonth()).toString();
            default -> day.toString();
        };
    }
}
