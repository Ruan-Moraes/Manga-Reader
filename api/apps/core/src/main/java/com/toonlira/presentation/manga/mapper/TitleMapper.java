package com.toonlira.presentation.manga.mapper;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.toonlira.application.author.port.TitleAuthorRepositoryPort;
import com.toonlira.application.manga.port.TitleRatingAggregateReadPort.TitleRatingAggregateView;
import com.toonlira.application.manga.service.GenreVocabulary;
import com.toonlira.application.manga.usecase.ChapterStats;
import com.toonlira.application.publisher.port.TitlePublisherRepositoryPort;
import com.toonlira.domain.author.entity.TitleAuthor;
import com.toonlira.domain.manga.entity.Title;
import com.toonlira.domain.publisher.entity.TitlePublisher;
import com.toonlira.presentation.manga.dto.TitleResponse;
import com.toonlira.presentation.shared.mapper.LocalizedMappingHelper;
import com.toonlira.shared.domain.i18n.LocalizedString;

import lombok.RequiredArgsConstructor;

/**
 * Mapper Title → TitleResponse (público). Resolve {@code name} e {@code synopsis}
 * pelo locale do request via {@link LocaleResolutionService}.
 * <p>
 * Nota e contagem vêm do agregado consolidado ({@code title_rating_aggregate}),
 * <b>não</b> dos campos do {@link Title} — fonte única, sem divergência entre
 * telas. Agregado ausente ⇒ {@code 0.0 / 0}.
 * <p>
 * {@code genres} são slugs canônicos resolvidos para o label do locale via
 * {@link GenreVocabulary}; slug fora do vocabulário cai no próprio slug.
 */
@Component
@RequiredArgsConstructor
public class TitleMapper {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    private final LocalizedMappingHelper i18n;
    private final GenreVocabulary genreVocabulary;
    private final TitleAuthorRepositoryPort titleAuthorRepository;
    private final TitlePublisherRepositoryPort titlePublisherRepository;

    public TitleResponse toResponse(Title title) {
        return toResponse(title, ChapterStats.EMPTY, null);
    }

    public TitleResponse toResponse(Title title, ChapterStats stats) {
        return toResponse(title, stats, null);
    }

    public TitleResponse toResponse(Title title, ChapterStats stats, TitleRatingAggregateView rating) {
        if (title == null) return null;

        return build(title, stats, rating,
                titleAuthorRepository.findByTitleId(title.getId()),
                titlePublisherRepository.findByTitleId(title.getId()));
    }

    /**
     * Overload de listagem (DT-52): recebe as junções pré-carregadas em lote
     * ({@link com.toonlira.application.manga.service.TitleAssociationReader}),
     * evitando o N+1 de buscar autores/editoras por título.
     */
    public TitleResponse toResponse(Title title, ChapterStats stats, TitleRatingAggregateView rating,
            Map<String, List<TitleAuthor>> authorsByTitle, Map<String, List<TitlePublisher>> publishersByTitle) {
        if (title == null) return null;

        return build(title, stats, rating,
                authorsByTitle.getOrDefault(title.getId(), List.of()),
                publishersByTitle.getOrDefault(title.getId(), List.of()));
    }

    private TitleResponse build(Title title, ChapterStats stats, TitleRatingAggregateView rating,
            List<TitleAuthor> authorLinks, List<TitlePublisher> publisherLinks) {
        var chapterStats = stats != null ? stats : ChapterStats.EMPTY;

        double ratingAverage = rating != null ? rating.ratingAverage() : 0.0;
        long ratingCount = rating != null ? rating.totalRatings() : 0L;

        return new TitleResponse(
                title.getId(),
                title.getType(),
                title.getCover(),
                i18n.toResolvedString(title.getName()),
                i18n.toResolvedString(title.getSynopsis()),
                resolveGenreLabels(title.getGenres()),
                title.getPopularity(),
                ratingAverage,
                ratingCount,
                title.isAdult(),
                title.getStatus(),
                title.getAuthor(),
                title.getArtist(),
                title.getPublisher(),
                TitleAssociationMapper.toAuthorResponses(authorLinks),
                TitleAssociationMapper.toPublisherResponses(publisherLinks),
                formatDate(title.getCreatedAt()),
                formatDate(title.getUpdatedAt()),
                (int) chapterStats.chaptersCount(),
                chapterStats.latestChapterNumber()
        );
    }

    public List<TitleResponse> toResponseList(List<Title> titles) {
        if (titles == null) return Collections.emptyList();

        return titles.stream().map(this::toResponse).toList();
    }

    /** Resolve slugs de gênero para o label do locale do request. */
    public List<String> resolveGenreLabels(List<String> slugs) {
        if (slugs == null || slugs.isEmpty()) {
            return Collections.emptyList();
        }

        var vocabulary = genreVocabulary.bySlug();

        return slugs.stream()
                .map(slug -> {
                    LocalizedString label = vocabulary.get(slug);
                    return label != null ? i18n.toResolvedString(label) : slug;
                })
                .toList();
    }

    private static String formatDate(LocalDateTime dateTime) {
        if (dateTime == null) return null;

        return dateTime.format(FMT);
    }
}
