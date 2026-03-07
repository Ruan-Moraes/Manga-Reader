package com.mangareader.application.category.port;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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

    Page<Tag> findAll(Pageable pageable);

    Page<Tag> findByLabelContainingIgnoreCase(String query, Pageable pageable);
}
