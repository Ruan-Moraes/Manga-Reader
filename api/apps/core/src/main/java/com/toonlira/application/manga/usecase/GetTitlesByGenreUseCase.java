package com.toonlira.application.manga.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.toonlira.application.manga.port.TitleRepositoryPort;
import com.toonlira.domain.manga.entity.Title;
import com.toonlira.application.manga.service.AdultContentAccessPolicy;
import java.util.UUID;

import lombok.RequiredArgsConstructor;

/**
 * Filtra títulos por gênero.
 */
@Service
@RequiredArgsConstructor
public class GetTitlesByGenreUseCase {
    private final TitleRepositoryPort titleRepository;
    private final AdultContentAccessPolicy adultContentAccessPolicy;

    public Page<Title> execute(String genre, Pageable pageable) {
        return execute(genre, pageable, null);
    }

    public Page<Title> execute(String genre, Pageable pageable, UUID userId) {
        return adultContentAccessPolicy.mustExcludeAdult(userId)
                ? titleRepository.findByGenreExcludingAdult(genre, pageable)
                : titleRepository.findByGenresContaining(genre, pageable);
    }
}
