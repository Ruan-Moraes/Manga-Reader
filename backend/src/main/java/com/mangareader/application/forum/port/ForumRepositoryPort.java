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

    Page<ForumTopic> findByLanguage(String language, Pageable pageable);

    Optional<ForumTopic> findById(UUID id);

    Page<ForumTopic> findByCategory(ForumCategory category, Pageable pageable);

    Page<ForumTopic> findByCategoryAndLanguage(ForumCategory category, String language, Pageable pageable);

    Page<ForumTopic> searchByTitle(String query, Pageable pageable);

    Page<ForumTopic> searchByTitleAndLanguage(String query, String language, Pageable pageable);

    ForumTopic save(ForumTopic topic);

    long countByAuthorId(UUID authorId);

    void deleteById(UUID id);
}
