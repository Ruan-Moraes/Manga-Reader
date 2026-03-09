package com.mangareader.presentation.manga.mapper;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;

import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.manga.valueobject.Chapter;
import com.mangareader.presentation.manga.dto.ChapterResponse;
import com.mangareader.presentation.manga.dto.TitleResponse;

/**
 * Mapper manual para converter entidades de domínio em DTOs de apresentação.
 * <p>
 * Optamos por mapper estático para simplificar, evitando configuração MapStruct
 * por enquanto neste módulo (MapStruct será utilizado quando houver mais DTOs).
 */
public final class TitleMapper {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    private TitleMapper() {}

    public static TitleResponse toResponse(Title title) {
        if (title == null) return null;

        return new TitleResponse(
                title.getId(),
                title.getType(),
                title.getCover(),
                title.getName(),
                title.getSynopsis(),
                title.getGenres() != null ? title.getGenres() : Collections.emptyList(),
                mapChapters(title.getChapters()),
                title.getPopularity(),
                title.getScore(),
                title.getAuthor(),
                title.getArtist(),
                title.getPublisher(),
                formatDate(title.getCreatedAt()),
                formatDate(title.getUpdatedAt())
        );
    }

    public static List<TitleResponse> toResponseList(List<Title> titles) {
        if (titles == null) return Collections.emptyList();
        return titles.stream().map(TitleMapper::toResponse).toList();
    }

    private static List<ChapterResponse> mapChapters(List<Chapter> chapters) {
        if (chapters == null) return Collections.emptyList();
        return chapters.stream()
                .map(ch -> new ChapterResponse(
                        ch.getNumber(),
                        ch.getTitle(),
                        ch.getReleaseDate(),
                        ch.getPages()
                ))
                .toList();
    }

    private static String formatDate(LocalDateTime dateTime) {
        if (dateTime == null) return null;
        return dateTime.format(FMT);
    }
}
