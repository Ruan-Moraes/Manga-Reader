package com.mangareader.presentation.admin.mapper;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.mangareader.application.author.port.TitleAuthorRepositoryPort;
import com.mangareader.application.manga.port.TitleRatingAggregateReadPort.TitleRatingAggregateView;
import com.mangareader.application.publisher.port.TitlePublisherRepositoryPort;
import com.mangareader.domain.author.entity.TitleAuthor;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.publisher.entity.TitlePublisher;
import com.mangareader.presentation.admin.dto.AdminTitleResponse;
import com.mangareader.presentation.admin.dto.TitleStoreResponse;
import com.mangareader.presentation.manga.mapper.TitleAssociationMapper;
import com.mangareader.shared.domain.i18n.LocalizedString;

import lombok.RequiredArgsConstructor;

/**
 * Mapper Title → AdminTitleResponse.
 * <p>
 * Nota/contagem vêm do agregado consolidado ({@code title_rating_aggregate}),
 * não dos campos do {@link Title}. Agregado ausente ⇒ {@code 0.0 / 0}. As listas
 * {@code authors}/{@code publishers} vêm das junções relacionais (Postgres),
 * em paralelo aos campos texto {@code author}/{@code artist}/{@code publisher}.
 */
@Component
@RequiredArgsConstructor
public class AdminTitleMapper {

    private final TitleAuthorRepositoryPort titleAuthorRepository;
    private final TitlePublisherRepositoryPort titlePublisherRepository;
    private final com.mangareader.application.manga.service.TitleStoreAssociationReader storeAssociationReader;

    public AdminTitleResponse toResponse(Title title, long chaptersCount) {
        return toResponse(title, chaptersCount, null);
    }

    public AdminTitleResponse toResponse(Title title, long chaptersCount, TitleRatingAggregateView rating) {
        return build(title, chaptersCount, rating,
                titleAuthorRepository.findByTitleId(title.getId()),
                titlePublisherRepository.findByTitleId(title.getId()));
    }

    /**
     * Overload de listagem (DT-52): recebe as junções pré-carregadas em lote
     * ({@link com.mangareader.application.manga.service.TitleAssociationReader}),
     * evitando o N+1 de buscar autores/editoras por título.
     */
    public AdminTitleResponse toResponse(Title title, long chaptersCount, TitleRatingAggregateView rating,
            Map<String, List<TitleAuthor>> authorsByTitle, Map<String, List<TitlePublisher>> publishersByTitle) {
        return build(title, chaptersCount, rating,
                authorsByTitle.getOrDefault(title.getId(), List.of()),
                publishersByTitle.getOrDefault(title.getId(), List.of()));
    }

    private AdminTitleResponse build(Title title, long chaptersCount, TitleRatingAggregateView rating,
            List<TitleAuthor> authorLinks, List<TitlePublisher> publisherLinks) {
        return new AdminTitleResponse(
                title.getId(),
                values(title.getName()),
                title.getType(),
                title.getCover(),
                values(title.getSynopsis()),
                title.getGenres(),
                title.getStatus(),
                title.getAuthor(),
                title.getArtist(),
                title.getPublisher(),
                TitleAssociationMapper.toAuthorResponses(authorLinks),
                TitleAssociationMapper.toPublisherResponses(publisherLinks),
                storeAssociationReader.byTitle(title.getId()),
                title.isAdult(),
                rating != null ? rating.ratingAverage() : 0.0,
                rating != null ? rating.totalRatings() : 0L,
                (int) chaptersCount,
                title.getCreatedAt(),
                title.getUpdatedAt()
        );
    }

    private static Map<String, String> values(LocalizedString s) {
        return s == null ? Map.of() : s.values();
    }
}
