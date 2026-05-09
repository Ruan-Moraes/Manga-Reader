package com.mangareader.presentation.manga.mapper;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;

import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.manga.valueobject.Chapter;
import com.mangareader.presentation.manga.dto.ChapterResponse;
import com.mangareader.presentation.manga.dto.TitleResponse;
import com.mangareader.presentation.shared.mapper.LocalizedMappingHelper;

import lombok.RequiredArgsConstructor;

/**
 * Mapper Title → TitleResponse (público). Resolve {@code name} e {@code synopsis}
 * pelo locale do request via {@link LocaleResolutionService}.
 */
@Component
@RequiredArgsConstructor
public class TitleMapper {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    private final LocalizedMappingHelper i18n;

    public TitleResponse toResponse(Title title) {
        if (title == null) return null;

        return new TitleResponse(
                title.getId(),
                title.getType(),
                title.getCover(),
                i18n.resolveOrFallback(title.getNameI18n(), title.getName()),
                i18n.resolveOrFallback(title.getSynopsisI18n(), title.getSynopsis()),
                title.getGenres() != null ? title.getGenres() : Collections.emptyList(),
                mapChapters(title.getChapters()),
                title.getPopularity(),
                title.getRatingAverage(),
                title.getRatingCount(),
                title.getRankingScore(),
                title.isAdult(),
                title.getStatus(),
                title.getAuthor(),
                title.getArtist(),
                title.getPublisher(),
                formatDate(title.getCreatedAt()),
                formatDate(title.getUpdatedAt())
        );
    }

    public List<TitleResponse> toResponseList(List<Title> titles) {
        if (titles == null) return Collections.emptyList();

        return titles.stream().map(this::toResponse).toList();
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
