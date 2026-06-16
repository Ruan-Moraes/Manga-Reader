package com.mangareader.application.author.usecase;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.author.port.AuthorRepositoryPort;
import com.mangareader.domain.author.entity.Author;
import com.mangareader.shared.exception.ResourceNotFoundException;

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
}
