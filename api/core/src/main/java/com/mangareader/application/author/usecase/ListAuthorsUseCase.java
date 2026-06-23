package com.mangareader.application.author.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.author.port.AuthorRepositoryPort;
import com.mangareader.domain.author.entity.Author;

import lombok.RequiredArgsConstructor;

/**
 * Lista autores paginados; filtra por nome quando {@code query} é informado.
 */
@Service
@RequiredArgsConstructor
public class ListAuthorsUseCase {
    private final AuthorRepositoryPort authorRepository;

    @Transactional(readOnly = true)
    public Page<Author> execute(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return authorRepository.findAll(pageable);
        }
        return authorRepository.searchByName(query, pageable);
    }
}
