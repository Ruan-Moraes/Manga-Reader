package com.mangareader.application.forum.port;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;

/**
 * Port de saída — acesso a dados de Forum Topics (PostgreSQL).
 */
public interface ForumRepositoryPort {

    Page<ForumTopic> findAll(Pageable pageable);

    Optional<ForumTopic> findById(UUID id);

    Page<ForumTopic> findByCategory(ForumCategory category, Pageable pageable);

    Page<ForumTopic> searchByTitle(String query, Pageable pageable);

    ForumTopic save(ForumTopic topic);

    void deleteById(UUID id);
}
