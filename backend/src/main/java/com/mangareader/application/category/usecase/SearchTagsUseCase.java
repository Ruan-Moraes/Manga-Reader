package com.mangareader.application.category.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.category.port.TagRepositoryPort;
import com.mangareader.domain.category.entity.Tag;

import lombok.RequiredArgsConstructor;

/**
 * Busca tags cujo label contenha a query informada.
 */
@Service
@RequiredArgsConstructor
public class SearchTagsUseCase {
    private final TagRepositoryPort tagRepository;

    public Page<Tag> execute(String query, Pageable pageable) {
        return tagRepository.findByLabelContainingIgnoreCase(query, pageable);
    }
}
