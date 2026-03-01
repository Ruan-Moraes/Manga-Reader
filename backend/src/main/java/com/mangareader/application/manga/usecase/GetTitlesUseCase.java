package com.mangareader.application.manga.usecase;

import java.util.List;

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

    public List<Title> execute() {
        return titleRepository.findAll();
    }
}
