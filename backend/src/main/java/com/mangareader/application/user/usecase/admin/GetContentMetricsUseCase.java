package com.mangareader.application.user.usecase.admin;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.mangareader.application.event.port.EventRepositoryPort;
import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.event.valueobject.EventStatus;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.presentation.admin.dto.ContentMetricsResponse;
import com.mangareader.presentation.admin.dto.ContentMetricsResponse.TopTitleResponse;

import lombok.RequiredArgsConstructor;

/**
 * Agrega métricas de conteúdo (titles + events) para o dashboard admin aprimorado.
 */
@Service
@RequiredArgsConstructor
public class GetContentMetricsUseCase {

    private static final int TOP_TITLES_LIMIT = 10;
    private static final List<String> TITLE_STATUSES = List.of(
            "ONGOING", "COMPLETED", "HIATUS", "CANCELLED"
    );

    private final TitleRepositoryPort titleRepository;
    private final EventRepositoryPort eventRepository;

    public ContentMetricsResponse execute() {
        Map<String, Long> titlesByStatus = new LinkedHashMap<>();
        for (String status : TITLE_STATUSES) {
            titlesByStatus.put(status, titleRepository.countByStatus(status));
        }

        Map<String, Long> eventsByStatus = new LinkedHashMap<>();
        for (EventStatus status : EventStatus.values()) {
            eventsByStatus.put(status.name(), eventRepository.countByStatus(status));
        }

        List<TopTitleResponse> topTitles = titleRepository
                .findTopByRankingScore(TOP_TITLES_LIMIT)
                .stream()
                .map(this::toTopTitleResponse)
                .toList();

        return new ContentMetricsResponse(titlesByStatus, eventsByStatus, topTitles);
    }

    private TopTitleResponse toTopTitleResponse(Title title) {
        return new TopTitleResponse(
                title.getId(),
                title.getName(),
                title.getCover(),
                title.getType(),
                title.getRankingScore(),
                title.getRatingAverage(),
                title.getRatingCount()
        );
    }
}
