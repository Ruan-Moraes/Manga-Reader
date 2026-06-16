package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.mangareader.application.author.port.AuthorRepositoryPort;
import com.mangareader.domain.author.entity.Author;
import com.mangareader.infrastructure.persistence.postgres.repository.AuthorJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port de Author ao Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
public class AuthorRepositoryAdapter implements AuthorRepositoryPort {
    private final AuthorJpaRepository repository;

    @Override
    public Optional<Author> findById(Long id) {
        return repository.findById(id);
    }

    @Override
    public Optional<Author> findBySlug(String slug) {
        return repository.findBySlug(slug);
    }

    @Override
    public boolean existsBySlug(String slug) {
        return repository.existsBySlug(slug);
    }

    @Override
    public Page<Author> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    @Override
    public Page<Author> searchByName(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return new PageImpl<>(java.util.List.of(), pageable, 0);
        }
        return repository.findByNameContainingIgnoreCase(query.trim(), pageable);
    }

    @Override
    public Author save(Author author) {
        return repository.save(author);
    }

    @Override
    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    @Override
    public long count() {
        return repository.count();
    }
}
