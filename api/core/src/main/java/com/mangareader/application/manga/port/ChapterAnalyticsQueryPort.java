package com.mangareader.application.manga.port;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public interface ChapterAnalyticsQueryPort {
    record ChapterKey(String titleId, String chapterNumber) {}
    record SummaryRequest(String titleId, String chapterNumber, Instant publishedAt) {
        public ChapterKey key() { return new ChapterKey(titleId, chapterNumber); }
    }
    record Filter(Instant from, Instant to, String device, String platform) {}
    record Snapshot(long totalReads, long uniqueReaders, double avgReadTimeSec,
            double completionRate, double avgReadPct, long abandonCount, double avgAbandonPage,
            Map<String, Long> readsByDevice, Map<String, Long> readsByPlatform,
            Instant firstReadAt, Instant lastReadAt, long first24hReads, long first7dReads) {}
    record SeriesPoint(String date, long value) {}

    Snapshot summarize(String titleId, String chapterNumber, Instant publishedAt, Filter filter);
    Map<ChapterKey, Snapshot> summarizeMany(List<SummaryRequest> chapters, Filter filter);
    List<SeriesPoint> series(String titleId, String chapterNumber, Filter filter, String granularity);
}
