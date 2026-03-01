package com.mangareader.application.manga.usecase;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.category.valueobject.SortCriteria;
import com.mangareader.domain.manga.entity.Title;

import lombok.RequiredArgsConstructor;

/**
 * Filtra títulos por múltiplos gêneros/tags e aplica ordenação.
 * <p>
 * Implementa a busca avançada da tela de Category/Filtros.
 */
@Service
@RequiredArgsConstructor
public class FilterTitlesUseCase {

    private final TitleRepositoryPort titleRepository;

    public List<Title> execute(List<String> genres, SortCriteria sort) {
        List<Title> titles;

        if (genres == null || genres.isEmpty()) {
            titles = titleRepository.findAll();
        } else {
            titles = titleRepository.findByGenresContainingAll(genres);
        }

        return applySort(titles, sort);
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
            case MOST_RATED -> titles.stream()
                    .sorted(Comparator.comparing(
                            (Title t) -> parseNumeric(t.getScore())).reversed())
                    .toList();
            case MOST_RECENT -> titles.stream()
                    .sorted(Comparator.comparing(
                            Title::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                    .toList();
            case ALPHABETICAL -> titles.stream()
                    .sorted(Comparator.comparing(
                            Title::getName, String.CASE_INSENSITIVE_ORDER))
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

    private double parseNumeric(String value) {
        if (value == null || value.isBlank()) return 0.0;
        try {
            return Double.parseDouble(value.replaceAll("[^\\d.]", ""));
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }
}
