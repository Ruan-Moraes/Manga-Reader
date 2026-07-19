package com.mangareader.application.manga.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.application.manga.service.AdultContentAccessPolicy;
import java.util.UUID;

import lombok.RequiredArgsConstructor;

/**
 * Busca títulos por nome (pesquisa parcial, case-insensitive).
 */
@Service
@RequiredArgsConstructor
public class SearchTitlesUseCase {
    private final TitleRepositoryPort titleRepository;
    private final AdultContentAccessPolicy adultContentAccessPolicy;

    public Page<Title> execute(String query, Pageable pageable) {
        return execute(query, pageable, null);
    }

    public Page<Title> execute(String query, Pageable pageable, UUID userId) {
        boolean excludeAdult = adultContentAccessPolicy.mustExcludeAdult(userId);
        if (query == null || query.isBlank()) {
            return excludeAdult ? titleRepository.findAllExcludingAdult(pageable) : titleRepository.findAll(pageable);
        }

        return excludeAdult ? titleRepository.searchByNameExcludingAdult(query.trim(), pageable) : titleRepository.searchByName(query.trim(), pageable);
    }
}
