package com.toonlira.application.manga.usecase;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.toonlira.application.manga.port.TitleRepositoryPort;
import com.toonlira.domain.manga.entity.Title;
import com.toonlira.shared.constant.CacheNames;
import com.toonlira.shared.exception.ResourceNotFoundException;
import com.toonlira.application.manga.service.AdultContentAccessPolicy;
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
