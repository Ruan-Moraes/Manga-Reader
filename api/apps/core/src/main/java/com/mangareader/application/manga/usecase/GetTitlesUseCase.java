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
 * Retorna todos os títulos (listagem principal).
 */
@Service
@RequiredArgsConstructor
public class GetTitlesUseCase {
    private final TitleRepositoryPort titleRepository;
    private final AdultContentAccessPolicy adultContentAccessPolicy;

    public Page<Title> execute(Pageable pageable) {
        return execute(pageable, null);
    }

    public Page<Title> execute(Pageable pageable, UUID userId) {
        return adultContentAccessPolicy.mustExcludeAdult(userId)
                ? titleRepository.findAllExcludingAdult(pageable)
                : titleRepository.findAll(pageable);
    }
}
