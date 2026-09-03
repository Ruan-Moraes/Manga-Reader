package com.mangareader.application.user.usecase.admin;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.event.port.EventRepositoryPort;
import com.mangareader.application.manga.port.TitleRatingAggregateReadPort;
import com.mangareader.application.manga.port.TitleRatingAggregateReadPort.TitleRatingAggregateView;
import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.event.valueobject.EventStatus;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.manga.valueobject.PublicationStatus;
import com.mangareader.presentation.admin.dto.ContentMetricsResponse;
import com.mangareader.presentation.admin.dto.ContentMetricsResponse.TopTitleResponse;
import com.mangareader.shared.application.i18n.LocaleResolutionService;

import lombok.RequiredArgsConstructor;

/**
 * Agrega métricas de conteúdo (titles + events) para o dashboard admin aprimorado.
 * <p>
 * Os "top titles" vêm do agregado oficial ({@code title_rating_aggregate},
 * mantido pelo serviço {@code rating-aggregator}), ordenados por nota — não há
 * mais campo de ranking desnormalizado no {@link Title}.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GetContentMetricsUseCase {
    private static final int TOP_TITLES_LIMIT = 10;

    private final TitleRepositoryPort titleRepository;
    private final TitleRatingAggregateReadPort ratingAggregateReadPort;
    private final EventRepositoryPort eventRepository;
    private final LocaleResolutionService localeResolutionService;

    public ContentMetricsResponse execute() {
        Map<String, Long> titlesByStatus = new LinkedHashMap<>();

        for (PublicationStatus status : PublicationStatus.values()) {
            titlesByStatus.put(status.name(),
                    titleRepository.countByStatus(status.name()));
        }

        Map<String, Long> eventsByStatus = new LinkedHashMap<>();

        for (EventStatus status : EventStatus.values()) {
            eventsByStatus.put(status.name(), eventRepository.countByStatus(status));
        }

        List<TopTitleResponse> topTitles = topTitlesByRating();

        return new ContentMetricsResponse(titlesByStatus, eventsByStatus, topTitles);
    }

    private List<TopTitleResponse> topTitlesByRating() {
        List<TitleRatingAggregateView> top = ratingAggregateReadPort.findTop(TOP_TITLES_LIMIT);

        if (top.isEmpty()) {
            return List.of();
        }

        Map<String, Title> titlesById = titleRepository
                .findByIds(top.stream().map(TitleRatingAggregateView::titleId).toList())
                .stream()
                .collect(Collectors.toMap(Title::getId, Function.identity()));

        return top.stream()
                .map(view -> {
                    Title title = titlesById.get(view.titleId());
                    return title == null ? null : toTopTitleResponse(title, view);
                })
                .filter(java.util.Objects::nonNull)
                .toList();
    }

    private TopTitleResponse toTopTitleResponse(Title title, TitleRatingAggregateView rating) {
        return new TopTitleResponse(
                title.getId(),
                localeResolutionService.resolve(title.getName()),
                title.getCover(),
                title.getType(),
                rating.ratingAverage(),
                rating.totalRatings()
        );
    }
}
