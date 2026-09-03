package com.mangareader.application.manga.usecase;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.shared.constant.CacheNames;
import com.mangareader.shared.exception.ResourceNotFoundException;
import com.mangareader.application.manga.service.AdultContentAccessPolicy;
import java.util.UUID;

import lombok.RequiredArgsConstructor;

/**
 * Retorna um título pelo ID.
 */
@Service
@RequiredArgsConstructor
public class GetTitleByIdUseCase {
    private final TitleRepositoryPort titleRepository;
    private final AdultContentAccessPolicy adultContentAccessPolicy;

    @Cacheable(value = CacheNames.TITLE, key = "#id")
    public Title execute(String id) {
        return titleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Title", "id", id));
    }

    public Title execute(String id, UUID userId) {
        Title title = execute(id);
        if (title.isAdult() && adultContentAccessPolicy.mustExcludeAdult(userId)) {
            throw new ResourceNotFoundException("Title", "id", id);
        }
        return title;
    }
}
