package com.mangareader.application.stats.usecase;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.presentation.stats.dto.PublicStatsResponse;
import com.mangareader.shared.constant.CacheNames;

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

    @Cacheable(CacheNames.PUBLIC_STATS)
    public PublicStatsResponse execute() {
        long totalTitles = titleRepository.count();
        long totalChapters = titleRepository.countTotalChapters();

        return new PublicStatsResponse(totalTitles, totalChapters);
    }
}
