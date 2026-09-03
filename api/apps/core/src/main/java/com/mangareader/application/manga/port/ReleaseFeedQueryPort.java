package com.mangareader.application.manga.port;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReleaseFeedQueryPort {
    record Query(
            Instant from,
            Instant to,
            String titleQuery,
            String language,
            Collection<String> restrictTitleIds,
            boolean excludeAdult) {}

    record Item(
            String chapterId,
            String titleId,
            Map<String, String> titleNames,
            String titleCover,
            String chapterNumber,
            Map<String, String> chapterTitles,
            Instant publishedAt,
            String contentLanguage,
            String scanGroupId,
            Map<String, String> scanGroupNames,
            String scanGroupLogo) {}

    Page<Item> find(Query query, Pageable pageable);

    List<String> findAvailableLanguages(Instant from, Instant to, boolean excludeAdult);

    List<String> findPublicChapterIds(Instant from, Instant to, boolean excludeAdult);

    boolean isPublicChapter(String chapterId, Instant now, boolean excludeAdult);
}
