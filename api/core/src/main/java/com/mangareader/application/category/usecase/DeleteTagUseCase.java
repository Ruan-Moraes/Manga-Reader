package com.mangareader.application.category.usecase;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.category.port.TagRepositoryPort;
import com.mangareader.application.shared.port.CacheInvalidationPort;
import com.mangareader.shared.constant.CacheNames;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Deleta uma tag pelo ID.
 */
@Service
@RequiredArgsConstructor
public class DeleteTagUseCase {
    private final TagRepositoryPort tagRepository;
    private final CacheInvalidationPort cacheInvalidation;

    @Transactional
    public void execute(Long id) {
        tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag", "id", id.toString()));

        tagRepository.deleteById(id);
        cacheInvalidation.evictAfterCommit(CacheNames.TAG, id);
    }
}
