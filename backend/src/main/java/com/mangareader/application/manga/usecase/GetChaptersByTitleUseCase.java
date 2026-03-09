package com.mangareader.application.manga.usecase;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.valueobject.Chapter;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Retorna todos os capítulos de um título.
 */
@Service
@RequiredArgsConstructor
public class GetChaptersByTitleUseCase {

    private final TitleRepositoryPort titleRepository;

    public List<Chapter> execute(String titleId) {
        var title = titleRepository.findById(titleId)
                .orElseThrow(() -> new ResourceNotFoundException("Title", "id", titleId));
        return title.getChapters();
    }
}
