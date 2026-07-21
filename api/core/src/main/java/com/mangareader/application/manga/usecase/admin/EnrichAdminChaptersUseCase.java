package com.mangareader.application.manga.usecase.admin;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.ChapterAnalyticsQueryPort;
import com.mangareader.application.manga.port.ChapterAnalyticsQueryPort.ChapterKey;
import com.mangareader.application.manga.port.ChapterAnalyticsQueryPort.Snapshot;
import com.mangareader.application.manga.port.ChapterAnalyticsQueryPort.SummaryRequest;
import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Chapter;
import com.mangareader.domain.manga.entity.Title;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EnrichAdminChaptersUseCase {
    private static final ChapterAnalyticsQueryPort.Filter ALL_TIME =
            new ChapterAnalyticsQueryPort.Filter(null, null, null, null);

    private final TitleRepositoryPort titles;
    private final ChapterAnalyticsQueryPort analytics;

    public record Details(Chapter chapter, Title title, Snapshot metrics) {}

    public List<Details> execute(List<Chapter> chapters) {
        if (chapters == null || chapters.isEmpty()) return List.of();
        Map<String, Title> titlesById = titles.findByIds(
                        chapters.stream().map(Chapter::getTitleId).distinct().toList()).stream()
                .collect(Collectors.toMap(Title::getId, Function.identity()));
        List<SummaryRequest> requests = chapters.stream()
                .map(chapter -> new SummaryRequest(
                        chapter.getTitleId(), chapter.getNumber(), chapter.getPublishedAt()))
                .toList();
        Map<ChapterKey, Snapshot> metrics = analytics.summarizeMany(requests, ALL_TIME);
        return chapters.stream().map(chapter -> new Details(
                chapter,
                titlesById.get(chapter.getTitleId()),
                metrics.get(new ChapterKey(chapter.getTitleId(), chapter.getNumber()))))
                .toList();
    }
}
