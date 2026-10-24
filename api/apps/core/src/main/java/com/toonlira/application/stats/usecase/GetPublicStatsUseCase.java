package com.toonlira.application.stats.usecase;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.toonlira.application.manga.port.ChapterRepositoryPort;
import com.toonlira.application.manga.port.TitleRepositoryPort;
import com.toonlira.presentation.stats.dto.PublicStatsResponse;
import com.toonlira.shared.constant.CacheNames;

import lombok.RequiredArgsConstructor;

/**
 * Retorna estatísticas públicas da plataforma (sem autenticação).
 * <p>
 * O resultado é cacheado no Redis por 30 minutos para evitar consultas
 * repetitivas ao MongoDB (aggregate de capítulos é custoso).
 */
@Service
@RequiredArgsConstructor
public class GetPublicStatsUseCase {
    private final TitleRepositoryPort titleRepository;
    private final ChapterRepositoryPort chapterRepository;

    @Cacheable(CacheNames.PUBLIC_STATS)
    public PublicStatsResponse execute() {
        long totalTitles = titleRepository.count();
        long totalChapters = chapterRepository.count();

        return new PublicStatsResponse(totalTitles, totalChapters);
    }
}
