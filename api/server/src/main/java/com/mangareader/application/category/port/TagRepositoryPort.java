package com.mangareader.application.category.port;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.mangareader.domain.category.entity.Tag;

/**
 * Port de saída — acesso a dados de Tags (PostgreSQL).
 */
public interface TagRepositoryPort {
    List<Tag> findAll();

    Optional<Tag> findById(Long id);

    /** Subconjunto de {@code slugs} que existe no vocabulário (validação de gênero). */
    Set<String> findExistingSlugs(Collection<String> slugs);

    Optional<Tag> findByLabelIgnoreCase(String label);

    List<Tag> findByLabelContainingIgnoreCase(String query);

    Tag save(Tag tag);

    void deleteById(Long id);

    Page<Tag> findAll(Pageable pageable);

    Page<Tag> findByLabelContainingIgnoreCase(String query, Pageable pageable);
}
