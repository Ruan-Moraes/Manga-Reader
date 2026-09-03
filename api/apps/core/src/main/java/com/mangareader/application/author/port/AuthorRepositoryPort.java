package com.mangareader.application.author.port;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.mangareader.domain.author.entity.Author;
import com.mangareader.domain.author.entity.AuthorAlias;

/**
 * Port de saída — acesso a dados de Authors (PostgreSQL).
 */
public interface AuthorRepositoryPort {
    Optional<Author> findById(Long id);

    Optional<Author> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Page<Author> findAll(Pageable pageable);

    Page<Author> searchByName(String query, Pageable pageable);

    Page<Author> searchCatalogAuthors(String normalizedQuery, Pageable pageable);

    Page<Author> searchCatalogArtists(String normalizedQuery, boolean excludeAuthors, Pageable pageable);

    List<AuthorAlias> findAliasesByAuthorIds(Collection<Long> authorIds);

    Author save(Author author);

    void deleteById(Long id);

    long count();
}
