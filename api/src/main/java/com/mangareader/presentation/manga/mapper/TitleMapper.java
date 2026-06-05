package com.mangareader.presentation.manga.mapper;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;

import com.mangareader.application.manga.usecase.ChapterStats;
import com.mangareader.domain.manga.entity.Title;
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
        return toResponse(title, ChapterStats.EMPTY);
    }

    public TitleResponse toResponse(Title title, ChapterStats stats) {
        if (title == null) return null;

        var chapterStats = stats != null ? stats : ChapterStats.EMPTY;

        return new TitleResponse(
                title.getId(),
                title.getType(),
                title.getCover(),
                i18n.toResolvedString(title.getName()),
                i18n.toResolvedString(title.getSynopsis()),
                title.getGenres() != null ? title.getGenres() : Collections.emptyList(),
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
                formatDate(title.getUpdatedAt()),
                (int) chapterStats.chaptersCount(),
                chapterStats.latestChapterNumber()
        );
    }

    public List<TitleResponse> toResponseList(List<Title> titles) {
        if (titles == null) return Collections.emptyList();

        return titles.stream().map(this::toResponse).toList();
    }

    private static String formatDate(LocalDateTime dateTime) {
        if (dateTime == null) return null;

        return dateTime.format(FMT);
    }
}
