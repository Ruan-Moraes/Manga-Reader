package com.mangareader.application.category.port;

import java.util.List;
import java.util.Optional;

import com.mangareader.domain.category.entity.Tag;

/**
 * Port de saída — acesso a dados de Tags (PostgreSQL).
 */
public interface TagRepositoryPort {

    List<Tag> findAll();

    Optional<Tag> findById(Long id);

    List<Tag> findByLabelContainingIgnoreCase(String query);

    Tag save(Tag tag);

    void deleteById(Long id);
}
