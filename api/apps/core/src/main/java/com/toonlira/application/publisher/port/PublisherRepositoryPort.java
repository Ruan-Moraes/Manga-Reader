package com.toonlira.application.publisher.port;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.toonlira.domain.publisher.entity.Publisher;
import com.toonlira.domain.publisher.entity.PublisherAlias;

/**
 * Port de saída — acesso a dados de Publishers (PostgreSQL).
 */
public interface PublisherRepositoryPort {
    Optional<Publisher> findById(Long id);

    Optional<Publisher> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Page<Publisher> findAll(Pageable pageable);

    Page<Publisher> searchByName(String query, Pageable pageable);

    Page<Publisher> searchCatalog(String normalizedQuery, Pageable pageable);

    List<PublisherAlias> findAliasesByPublisherIds(Collection<Long> publisherIds);

    Publisher save(Publisher publisher);

    void deleteById(Long id);

    long count();
}
