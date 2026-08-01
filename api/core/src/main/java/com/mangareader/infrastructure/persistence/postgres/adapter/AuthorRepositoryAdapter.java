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

import com.mangareader.application.author.port.AuthorRepositoryPort;
import com.mangareader.domain.author.entity.Author;
import com.mangareader.domain.author.entity.AuthorAlias;
import com.mangareader.infrastructure.persistence.postgres.repository.AuthorAliasJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.AuthorJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port de Author ao Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
public class AuthorRepositoryAdapter implements AuthorRepositoryPort {
    private final AuthorJpaRepository repository;
    private final AuthorAliasJpaRepository aliasRepository;

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
        return hydrateAliases(repository.findAll(pageable));
    }

    @Override
    public Page<Author> searchByName(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return new PageImpl<>(java.util.List.of(), pageable, 0);
        }
        return hydrateAliases(repository.findByNameContainingIgnoreCase(query.trim(), pageable));
    }

    @Override
    public Page<Author> searchCatalogAuthors(String normalizedQuery, Pageable pageable) {
        return repository.searchCatalogAuthors(normalizedQuery, pageable);
    }

    @Override
    public Page<Author> searchCatalogArtists(
            String normalizedQuery, boolean excludeAuthors, Pageable pageable) {
        return repository.searchCatalogArtists(normalizedQuery, excludeAuthors, pageable);
    }

    @Override
    public List<AuthorAlias> findAliasesByAuthorIds(Collection<Long> authorIds) {
        return authorIds == null || authorIds.isEmpty()
                ? List.of()
                : aliasRepository.findByAuthorIdIn(authorIds);
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

    private Page<Author> hydrateAliases(Page<Author> page) {
        if (page.isEmpty()) {
            return page;
        }

        List<Long> ids = page.getContent().stream().map(Author::getId).toList();
        Map<Long, Author> authorsById = repository.findAllWithAliasesByIdIn(ids).stream()
                .collect(Collectors.toMap(Author::getId, Function.identity()));
        List<Author> content = page.getContent().stream()
                .map(author -> authorsById.getOrDefault(author.getId(), author))
                .toList();

        return new PageImpl<>(content, page.getPageable(), page.getTotalElements());
    }
}
