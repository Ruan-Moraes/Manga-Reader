package com.mangareader.presentation.admin.mapper;

import com.mangareader.domain.manga.entity.Title;
import com.mangareader.presentation.admin.dto.AdminTitleResponse;

/**
 * Mapper estático Title → AdminTitleResponse.
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
}
