package com.mangareader.application.manga.usecase;

import java.time.Clock;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.ChapterRepositoryPort;
import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.manga.service.AdultContentAccessPolicy;
import com.mangareader.domain.manga.entity.Chapter;
import com.mangareader.domain.manga.valueobject.ChapterStatus;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GetReaderChapterUseCase {
    private final ChapterRepositoryPort chapters;
    private final TitleRepositoryPort titles;
    private final AdultContentAccessPolicy adultPolicy;
    private final Clock clock;

    public Chapter execute(String titleId, String number, boolean previewAllowed, UUID userId) {
        var title = titles.findById(titleId).orElseThrow(() -> new ResourceNotFoundException("Title", "id", titleId));
        if (title.isAdult() && adultPolicy.mustExcludeAdult(userId)) throw new ResourceNotFoundException("Title", "id", titleId);
        Chapter chapter = chapters.findAnyByTitleIdAndNumber(titleId, number)
                .filter(item -> item.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Chapter", "number", number));
        boolean publiclyAvailable = chapter.getStatus() == ChapterStatus.PUBLISHED
                && (chapter.getPublishedAt() == null || !chapter.getPublishedAt().isAfter(clock.instant()));
        if (!previewAllowed && !publiclyAvailable) {
            throw new ResourceNotFoundException("Chapter", "number", number);
        }
        return chapter;
    }
}
