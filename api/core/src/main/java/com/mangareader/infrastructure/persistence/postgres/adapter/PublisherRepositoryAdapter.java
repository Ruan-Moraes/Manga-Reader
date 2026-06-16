package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.mangareader.application.publisher.port.PublisherRepositoryPort;
import com.mangareader.domain.publisher.entity.Publisher;
import com.mangareader.infrastructure.persistence.postgres.repository.PublisherJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port de Publisher ao Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
public class PublisherRepositoryAdapter implements PublisherRepositoryPort {
    private final PublisherJpaRepository repository;

    @Override
    public Optional<Publisher> findById(Long id) {
        return repository.findById(id);
    }

    @Override
    public Optional<Publisher> findBySlug(String slug) {
        return repository.findBySlug(slug);
    }

    @Override
    public boolean existsBySlug(String slug) {
        return repository.existsBySlug(slug);
    }

    @Override
    public Page<Publisher> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    @Override
    public Page<Publisher> searchByName(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return new PageImpl<>(java.util.List.of(), pageable, 0);
        }
        return repository.findByNameContainingIgnoreCase(query.trim(), pageable);
    }

    @Override
    public Publisher save(Publisher publisher) {
        return repository.save(publisher);
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
