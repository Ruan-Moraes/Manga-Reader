package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.mangareader.domain.author.entity.Author;

/**
 * Spring Data JPA repository para autores.
 */
public interface AuthorJpaRepository extends JpaRepository<Author, Long> {
    Optional<Author> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Page<Author> findByNameContainingIgnoreCase(String name, Pageable pageable);
}
