package com.mangareader.application.manga.usecase;

import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.valueobject.Chapter;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Retorna um capítulo específico pelo número.
 */
@Service
@RequiredArgsConstructor
public class GetChapterByNumberUseCase {

    private final TitleRepositoryPort titleRepository;

    public Chapter execute(String titleId, String chapterNumber) {
        var title = titleRepository.findById(titleId)
                .orElseThrow(() -> new ResourceNotFoundException("Title", "id", titleId));

        return title.getChapters().stream()
                .filter(ch -> ch.getNumber().equals(chapterNumber))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Chapter", "number", chapterNumber));
    }
}
