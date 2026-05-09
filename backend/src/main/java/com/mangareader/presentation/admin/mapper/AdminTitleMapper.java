package com.mangareader.presentation.admin.mapper;

import java.util.Map;

import com.mangareader.domain.manga.entity.Title;
import com.mangareader.presentation.admin.dto.AdminTitleResponse;
import com.mangareader.shared.domain.i18n.LocalizedString;

/**
 * Mapper estático Title → AdminTitleResponse. Inclui mapas *I18n.
 */
public final class AdminTitleMapper {

    private AdminTitleMapper() {
    }

    public static AdminTitleResponse toResponse(Title title) {
        return new AdminTitleResponse(
                title.getId(),
                title.getName(),
                title.getType(),
                title.getCover(),
                title.getSynopsis(),
                values(title.getNameI18n()),
                values(title.getSynopsisI18n()),
                title.getGenres(),
                title.getStatus(),
                title.getAuthor(),
                title.getArtist(),
                title.getPublisher(),
                title.isAdult(),
                title.getRatingAverage(),
                title.getRatingCount(),
                title.getChapters() != null ? title.getChapters().size() : 0,
                title.getCreatedAt(),
                title.getUpdatedAt()
        );
    }

    private static Map<String, String> values(LocalizedString s) {
        return s == null ? Map.of() : s.values();
    }
}
