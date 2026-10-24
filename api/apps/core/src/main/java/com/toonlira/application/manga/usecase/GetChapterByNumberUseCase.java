package com.toonlira.application.manga.usecase;

import org.springframework.stereotype.Service;

import com.toonlira.application.manga.port.ChapterRepositoryPort;
import com.toonlira.application.manga.port.TitleRepositoryPort;
import com.toonlira.application.manga.service.AdultContentAccessPolicy;
import com.toonlira.domain.manga.entity.Chapter;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;
import java.util.UUID;

/**
 * Retorna um capítulo específico pelo número (coleção própria — DT-17).
 */
@Service
@RequiredArgsConstructor
public class GetChapterByNumberUseCase {
    private final ChapterRepositoryPort chapterRepository;
    private final TitleRepositoryPort titleRepository;
    private final AdultContentAccessPolicy adultPolicy;

    public Chapter execute(String titleId, String chapterNumber) {
        return execute(titleId, chapterNumber, null);
    }

    public Chapter execute(String titleId, String chapterNumber, UUID userId) {
        var title = titleRepository.findById(titleId);
        if (title.isEmpty() || (title.get().isAdult() && adultPolicy.mustExcludeAdult(userId))) {
            throw new ResourceNotFoundException("Title", "id", titleId);
        }
        return chapterRepository.findByTitleIdAndNumber(titleId, chapterNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Chapter", "number", chapterNumber));
    }
}
