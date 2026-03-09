package com.mangareader.application.manga.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Title;

import lombok.RequiredArgsConstructor;

/**
 * Retorna todos os títulos (listagem principal).
 */
@Service
@RequiredArgsConstructor
public class GetTitlesUseCase {

    private final TitleRepositoryPort titleRepository;

    public Page<Title> execute(Pageable pageable) {
        return titleRepository.findAll(pageable);
    }
}
