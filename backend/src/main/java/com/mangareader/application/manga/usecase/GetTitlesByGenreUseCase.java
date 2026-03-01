package com.mangareader.application.manga.usecase;

import java.util.List;

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

    public List<Title> execute(String genre) {
        return titleRepository.findByGenresContaining(genre);
    }
}
