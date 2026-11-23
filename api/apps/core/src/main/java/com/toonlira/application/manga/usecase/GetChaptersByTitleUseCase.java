package com.toonlira.application.manga.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.toonlira.application.manga.port.ChapterRepositoryPort;
import com.toonlira.application.manga.port.TitleRepositoryPort;
import com.toonlira.application.manga.service.AdultContentAccessPolicy;
import com.toonlira.domain.manga.entity.Chapter;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;
import java.util.UUID;

/**
 * Retorna os capítulos de um título, paginados (coleção própria — DT-17).
 */
@Service
@RequiredArgsConstructor
public class GetChaptersByTitleUseCase {
    private final ChapterRepositoryPort chapterRepository;
    private final TitleRepositoryPort titleRepository;
    private final AdultContentAccessPolicy adultPolicy;

    public Page<Chapter> execute(String titleId, Pageable pageable) {
        return execute(titleId, pageable, null);
    }

    public Page<Chapter> execute(String titleId, Pageable pageable, UUID userId) {
        var title = titleRepository.findById(titleId);
        if (title.isEmpty() || (title.get().isAdult() && adultPolicy.mustExcludeAdult(userId))) {
            throw new ResourceNotFoundException("Title", "id", titleId);
        }

        return chapterRepository.findByTitleId(titleId, pageable);
    }
}
