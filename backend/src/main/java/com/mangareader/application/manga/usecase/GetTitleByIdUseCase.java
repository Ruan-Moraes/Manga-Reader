package com.mangareader.application.manga.usecase;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.shared.constant.CacheNames;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Retorna um título pelo ID.
 */
@Service
@RequiredArgsConstructor
public class GetTitleByIdUseCase {

    private final TitleRepositoryPort titleRepository;

    @Cacheable(value = CacheNames.TITLE, key = "#id")
    public Title execute(String id) {
        return titleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Title", "id", id));
    }
}
