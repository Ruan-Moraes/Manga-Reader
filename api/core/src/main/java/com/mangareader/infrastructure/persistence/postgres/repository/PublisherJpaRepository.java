package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.mangareader.domain.publisher.entity.Publisher;

/**
 * Spring Data JPA repository para editoras.
 */
public interface PublisherJpaRepository extends JpaRepository<Publisher, Long> {
    Optional<Publisher> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Page<Publisher> findByNameContainingIgnoreCase(String name, Pageable pageable);
}
