package com.mangareader.application.manga.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    public Page<Title> execute(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return titleRepository.findAll(pageable);
        }
        return titleRepository.searchByName(query.trim(), pageable);
    }
}
