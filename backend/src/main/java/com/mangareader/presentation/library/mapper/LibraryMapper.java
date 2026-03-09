package com.mangareader.presentation.library.mapper;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;

import com.mangareader.domain.library.entity.SavedManga;
import com.mangareader.presentation.library.dto.SavedMangaResponse;

/**
 * Mapper para converter entidade SavedManga em DTO de resposta.
 */
public final class LibraryMapper {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private LibraryMapper() {}

    public static SavedMangaResponse toResponse(SavedManga saved) {
        if (saved == null) return null;

        return new SavedMangaResponse(
                saved.getTitleId(),
                saved.getName(),
                saved.getCover(),
                saved.getType(),
                saved.getList().getDisplayName(),
                formatDate(saved.getSavedAt())
        );
    }

    public static List<SavedMangaResponse> toResponseList(List<SavedManga> savedMangas) {
        if (savedMangas == null) return Collections.emptyList();
        return savedMangas.stream().map(LibraryMapper::toResponse).toList();
    }

    private static String formatDate(LocalDateTime dateTime) {
        if (dateTime == null) return null;
        return dateTime.format(FMT);
    }
}
