package com.mangareader.application.manga.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Title;

import lombok.RequiredArgsConstructor;

/**
 * Filtra títulos por gênero.
 */
@Service
@RequiredArgsConstructor
public class GetTitlesByGenreUseCase {

    private final TitleRepositoryPort titleRepository;

    public Page<Title> execute(String genre, Pageable pageable) {
        return titleRepository.findByGenresContaining(genre, pageable);
    }
}
