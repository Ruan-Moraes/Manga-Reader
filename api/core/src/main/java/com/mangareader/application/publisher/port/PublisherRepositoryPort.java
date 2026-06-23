package com.mangareader.application.publisher.port;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.mangareader.domain.publisher.entity.Publisher;

/**
 * Port de saída — acesso a dados de Publishers (PostgreSQL).
 */
public interface PublisherRepositoryPort {
    Optional<Publisher> findById(Long id);

    Optional<Publisher> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Page<Publisher> findAll(Pageable pageable);

    Page<Publisher> searchByName(String query, Pageable pageable);

    Publisher save(Publisher publisher);

    void deleteById(Long id);

    long count();
}
