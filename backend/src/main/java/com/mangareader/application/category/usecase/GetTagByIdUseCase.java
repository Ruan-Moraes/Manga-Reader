package com.mangareader.application.category.usecase;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.mangareader.application.category.port.TagRepositoryPort;
import com.mangareader.domain.category.entity.Tag;
import com.mangareader.shared.constant.CacheNames;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Busca uma tag pelo ID.
 */
@Service
@RequiredArgsConstructor
public class GetTagByIdUseCase {

    private final TagRepositoryPort tagRepository;

    @Cacheable(value = CacheNames.TAG, key = "#id")
    public Tag execute(Long id) {
        return tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag", "id", id.toString()));
    }
}
