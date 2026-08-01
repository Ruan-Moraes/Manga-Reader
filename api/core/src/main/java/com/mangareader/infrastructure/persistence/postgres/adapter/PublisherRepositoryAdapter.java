package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.mangareader.application.publisher.port.PublisherRepositoryPort;
import com.mangareader.domain.publisher.entity.Publisher;
import com.mangareader.domain.publisher.entity.PublisherAlias;
import com.mangareader.infrastructure.persistence.postgres.repository.PublisherAliasJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.PublisherJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port de Publisher ao Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
public class PublisherRepositoryAdapter implements PublisherRepositoryPort {
    private final PublisherJpaRepository repository;
    private final PublisherAliasJpaRepository aliasRepository;

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
        return hydrateAliases(repository.findAll(pageable));
    }

    @Override
    public Page<Publisher> searchByName(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return new PageImpl<>(java.util.List.of(), pageable, 0);
        }
        return hydrateAliases(repository.findByNameContainingIgnoreCase(query.trim(), pageable));
    }

    @Override
    public Page<Publisher> searchCatalog(String normalizedQuery, Pageable pageable) {
        return repository.searchCatalog(normalizedQuery, pageable);
    }

    @Override
    public List<PublisherAlias> findAliasesByPublisherIds(Collection<Long> publisherIds) {
        return publisherIds == null || publisherIds.isEmpty()
                ? List.of()
                : aliasRepository.findByPublisherIdIn(publisherIds);
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

    private Page<Publisher> hydrateAliases(Page<Publisher> page) {
        if (page.isEmpty()) {
            return page;
        }

        List<Long> ids = page.getContent().stream().map(Publisher::getId).toList();
        Map<Long, Publisher> publishersById = repository.findAllWithAliasesByIdIn(ids).stream()
                .collect(Collectors.toMap(Publisher::getId, Function.identity()));
        List<Publisher> content = page.getContent().stream()
                .map(publisher -> publishersById.getOrDefault(publisher.getId(), publisher))
                .toList();

        return new PageImpl<>(content, page.getPageable(), page.getTotalElements());
    }
}
