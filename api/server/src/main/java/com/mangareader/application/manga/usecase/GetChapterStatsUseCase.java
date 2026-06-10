package com.mangareader.application.manga.usecase;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.ChapterRepositoryPort;

import lombok.RequiredArgsConstructor;

/**
 * Estatísticas de capítulos (contagem + último número) por título, em duas
 * queries agregadas — sem N+1 (DT-19). Reusado por todos os endpoints de
 * catálogo via {@code TitleController}. Títulos sem capítulos retornam
 * {@link ChapterStats#EMPTY}.
 */
@Service
@RequiredArgsConstructor
public class GetChapterStatsUseCase {
    private final ChapterRepositoryPort chapterRepository;

    public Map<String, ChapterStats> execute(Collection<String> titleIds) {
        if (titleIds == null || titleIds.isEmpty()) {
            return Map.of();
        }

        Map<String, Long> counts = chapterRepository.countByTitleIdIn(titleIds);
        Map<String, String> latest = chapterRepository.latestChapterNumberByTitleIdIn(titleIds);

        Map<String, ChapterStats> stats = new HashMap<>();

        for (String titleId : titleIds) {
            long count = counts.getOrDefault(titleId, 0L);

            if (count == 0L) {
                continue;
            }

            stats.put(titleId, new ChapterStats(count, latest.get(titleId)));
        }

        return stats;
    }
}
