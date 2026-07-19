package com.mangareader.application.manga.usecase.admin;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.ChapterAnalyticsQueryPort;
import com.mangareader.application.manga.port.ChapterRepositoryPort;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GetAdminChapterAnalyticsUseCase {
    private final ChapterRepositoryPort chapters;
    private final ChapterAnalyticsQueryPort analytics;

    public record Metrics(String chapterId, long totalReads, long uniqueReaders, double avgReadTimeSec,
            double completionRate, double avgReadPct, long abandonCount, double avgAbandonPage,
            long favoritesAfterRead, Map<String, Long> readsByDevice, Map<String, Long> readsByPlatform,
            Object vsPreviousChapter, Comparison vsTitleAverage, Instant firstReadAt, Instant lastReadAt,
            long first24hReads, long first7dReads) {}
    public record Comparison(double reads, double completionRate) {}

    public Metrics metrics(String chapterId, ChapterAnalyticsQueryPort.Filter filter) {
        var chapter = chapters.findById(chapterId)
                .orElseThrow(() -> new ResourceNotFoundException("Chapter", "id", chapterId));
        var result = analytics.summarize(chapter.getTitleId(), chapter.getNumber(), chapter.getPublishedAt(), filter);
        return new Metrics(chapterId, result.totalReads(), result.uniqueReaders(), result.avgReadTimeSec(),
                result.completionRate(), result.avgReadPct(), result.abandonCount(), result.avgAbandonPage(),
                0, result.readsByDevice(), result.readsByPlatform(), null, new Comparison(0, 0),
                result.firstReadAt(), result.lastReadAt(), result.first24hReads(), result.first7dReads());
    }

    public List<ChapterAnalyticsQueryPort.SeriesPoint> series(String chapterId,
            ChapterAnalyticsQueryPort.Filter filter, String granularity) {
        var chapter = chapters.findById(chapterId)
                .orElseThrow(() -> new ResourceNotFoundException("Chapter", "id", chapterId));
        return analytics.series(chapter.getTitleId(), chapter.getNumber(), filter, granularity);
    }
}
