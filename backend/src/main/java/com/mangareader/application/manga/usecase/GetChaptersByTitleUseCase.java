package com.mangareader.application.manga.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.ChapterRepositoryPort;
import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Chapter;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Retorna os capítulos de um título, paginados (coleção própria — DT-17).
 */
@Service
@RequiredArgsConstructor
public class GetChaptersByTitleUseCase {
    private final ChapterRepositoryPort chapterRepository;
    private final TitleRepositoryPort titleRepository;

    public Page<Chapter> execute(String titleId, Pageable pageable) {
        if (titleRepository.findById(titleId).isEmpty()) {
            throw new ResourceNotFoundException("Title", "id", titleId);
        }

        return chapterRepository.findByTitleId(titleId, pageable);
    }
}
