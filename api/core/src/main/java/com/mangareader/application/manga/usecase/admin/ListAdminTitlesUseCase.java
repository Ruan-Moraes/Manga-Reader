package com.mangareader.application.manga.usecase.admin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Title;

import lombok.RequiredArgsConstructor;

/**
 * Listagem administrativa de títulos com busca opcional por nome.
 */
@Service
@RequiredArgsConstructor
public class ListAdminTitlesUseCase {
    private final TitleRepositoryPort titleRepository;

    public Page<Title> execute(String search, Pageable pageable) {
        return (search != null && !search.isBlank())
                ? titleRepository.searchByName(search, pageable)
                : titleRepository.findAll(pageable);
    }
}
