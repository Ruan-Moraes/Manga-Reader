package com.mangareader.application.manga.usecase;

import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.ChapterRepositoryPort;
import com.mangareader.domain.manga.entity.Chapter;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Retorna um capítulo específico pelo número (coleção própria — DT-17).
 */
@Service
@RequiredArgsConstructor
public class GetChapterByNumberUseCase {
    private final ChapterRepositoryPort chapterRepository;

    public Chapter execute(String titleId, String chapterNumber) {
        return chapterRepository.findByTitleIdAndNumber(titleId, chapterNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Chapter", "number", chapterNumber));
    }
}
