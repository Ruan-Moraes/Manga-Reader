package com.mangareader.application.manga.usecase;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Title;

import lombok.RequiredArgsConstructor;

/**
 * Busca títulos por nome (pesquisa parcial, case-insensitive).
 */
@Service
@RequiredArgsConstructor
public class SearchTitlesUseCase {

    private final TitleRepositoryPort titleRepository;

    public List<Title> execute(String query) {
        if (query == null || query.isBlank()) {
            return titleRepository.findAll();
        }
        return titleRepository.searchByName(query.trim());
    }
}
