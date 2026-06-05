package com.mangareader.presentation.admin.mapper;

import java.util.Map;

import com.mangareader.domain.manga.entity.Title;
import com.mangareader.presentation.admin.dto.AdminTitleResponse;
import com.mangareader.shared.domain.i18n.LocalizedString;

/**
 * Mapper estático Title → AdminTitleResponse.
 */
public final class AdminTitleMapper {

    private AdminTitleMapper() {
    }

    public static AdminTitleResponse toResponse(Title title, long chaptersCount) {
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
                title.getRatingAverage(),
                title.getRatingCount(),
                (int) chaptersCount,
                title.getCreatedAt(),
                title.getUpdatedAt()
        );
    }

    private static Map<String, String> values(LocalizedString s) {
        return s == null ? Map.of() : s.values();
    }
}
