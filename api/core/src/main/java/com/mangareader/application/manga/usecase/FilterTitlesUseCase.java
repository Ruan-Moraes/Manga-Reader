package com.mangareader.application.manga.usecase;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.TitleRatingAggregateReadPort;
import com.mangareader.application.manga.port.TitleRatingAggregateReadPort.TitleRatingAggregateView;
import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.category.valueobject.SortCriteria;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.shared.application.i18n.LocaleResolutionService;

import lombok.RequiredArgsConstructor;

/**
 * Filtra títulos por gêneros, status e conteúdo adulto, e aplica ordenação.
 */
@Service
@RequiredArgsConstructor
public class FilterTitlesUseCase {
    private final TitleRepositoryPort titleRepository;
    private final TitleRatingAggregateReadPort ratingAggregateReadPort;
    private final LocaleResolutionService localeResolutionService;

    public Page<Title> execute(List<String> genres, String status, Boolean adult,
                               SortCriteria sort, Pageable pageable) {
        List<Title> titles = titleRepository.findByFilters(genres, status, adult);

        List<Title> sorted = applySort(titles, sort);

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), sorted.size());
        var content = start < sorted.size() ? sorted.subList(start, end) : List.<Title>of();

        return new PageImpl<>(content, pageable, sorted.size());
    }

    private List<Title> applySort(List<Title> titles, SortCriteria sort) {
        if (sort == null) {
            return titles;
        }

        return switch (sort) {
            case MOST_READ -> titles.stream()
                    .sorted(Comparator.comparing(
                            (Title t) -> parseNumeric(t.getPopularity())).reversed())
                    .toList();
            case MOST_RATED -> {
                Map<String, TitleRatingAggregateView> ratings = ratingAggregateReadPort
                        .findByTitleIdIn(titles.stream().map(Title::getId).toList());
                yield titles.stream()
                        .sorted(Comparator.comparing(
                                (Title t) -> ratingAverageOf(ratings, t.getId())).reversed())
                        .toList();
            }
            case MOST_RECENT -> titles.stream()
                    .sorted(Comparator.comparing(
                            Title::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                    .toList();
            case ALPHABETICAL -> titles.stream()
                    .sorted(Comparator.comparing(
                            t -> localeResolutionService.resolve(t.getName()), String.CASE_INSENSITIVE_ORDER))
                    .toList();
            case ASCENSION -> titles.stream()
                    .sorted(Comparator.comparing(
                            (Title t) -> parseNumeric(t.getPopularity())))
                    .toList();
            case RANDOM -> {
                var shuffled = new java.util.ArrayList<>(titles);
                java.util.Collections.shuffle(shuffled);
                yield shuffled;
            }
        };
    }

    private static double ratingAverageOf(Map<String, TitleRatingAggregateView> ratings, String titleId) {
        var view = ratings.get(titleId);

        return view != null ? view.ratingAverage() : 0.0;
    }

    private double parseNumeric(String value) {
        if (value == null || value.isBlank()) return 0.0;

        try {
            return Double.parseDouble(value.replaceAll("[^\\d.]", ""));
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }
}
