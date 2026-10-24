package com.toonlira.application.category.usecase;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.category.port.TagRepositoryPort;
import com.toonlira.domain.category.entity.Tag;
import com.toonlira.shared.constant.CacheNames;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Busca uma tag pelo ID.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GetTagByIdUseCase {
    private final TagRepositoryPort tagRepository;

    @Cacheable(value = CacheNames.TAG, key = "#id")
    public Tag execute(Long id) {
        return tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag", "id", id.toString()));
    }
}
