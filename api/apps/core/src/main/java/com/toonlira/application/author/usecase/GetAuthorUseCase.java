package com.toonlira.application.author.usecase;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.author.port.AuthorRepositoryPort;
import com.toonlira.domain.author.entity.Author;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Retorna um autor pelo ID.
 */
@Service
@RequiredArgsConstructor
public class GetAuthorUseCase {
    private final AuthorRepositoryPort authorRepository;

    @Transactional(readOnly = true)
    public Author execute(Long id) {
        return authorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Author", "id", id));
    }

    @Transactional(readOnly = true)
    public Author executeBySlug(String slug) {
        return authorRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Author", "slug", slug));
    }
}
