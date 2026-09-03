package com.mangareader.presentation.manga.mapper;

import java.util.List;

import com.mangareader.domain.author.entity.TitleAuthor;
import com.mangareader.domain.publisher.entity.TitlePublisher;
import com.mangareader.presentation.manga.dto.TitleAuthorResponse;
import com.mangareader.presentation.manga.dto.TitlePublisherResponse;

/**
 * Converte junções {@code title_authors} / {@code title_publishers} em DTOs de resposta.
 */
public final class TitleAssociationMapper {

    private TitleAssociationMapper() {
    }

    public static List<TitleAuthorResponse> toAuthorResponses(List<TitleAuthor> links) {
        if (links == null) return List.of();

        return links.stream()
                .map(link -> new TitleAuthorResponse(
                        link.getAuthor().getId(),
                        link.getAuthor().getName(),
                        link.getAuthor().getSlug(),
                        link.getRole().name()))
                .toList();
    }

    public static List<TitlePublisherResponse> toPublisherResponses(List<TitlePublisher> links) {
        if (links == null) return List.of();

        return links.stream()
                .map(link -> new TitlePublisherResponse(
                        link.getPublisher().getId(),
                        link.getPublisher().getName(),
                        link.getPublisher().getSlug()))
                .toList();
    }
}
