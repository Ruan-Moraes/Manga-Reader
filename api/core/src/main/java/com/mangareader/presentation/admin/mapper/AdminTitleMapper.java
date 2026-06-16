package com.mangareader.presentation.admin.mapper;

import java.util.Map;

import com.mangareader.application.manga.port.TitleRatingAggregateReadPort.TitleRatingAggregateView;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.presentation.admin.dto.AdminTitleResponse;
import com.mangareader.shared.domain.i18n.LocalizedString;

/**
 * Mapper estático Title → AdminTitleResponse.
 * <p>
 * Nota/contagem vêm do agregado consolidado ({@code title_rating_aggregate}),
 * não dos campos do {@link Title}. Agregado ausente ⇒ {@code 0.0 / 0}.
 */
public final class AdminTitleMapper {

    private AdminTitleMapper() {
    }

    public static AdminTitleResponse toResponse(Title title, long chaptersCount) {
        return toResponse(title, chaptersCount, null);
    }

    public static AdminTitleResponse toResponse(Title title, long chaptersCount, TitleRatingAggregateView rating) {
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
