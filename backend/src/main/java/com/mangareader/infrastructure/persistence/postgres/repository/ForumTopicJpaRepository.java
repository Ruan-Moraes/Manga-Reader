package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;

/**
 * Repositório JPA para tópicos do fórum.
 */
public interface ForumTopicJpaRepository extends JpaRepository<ForumTopic, UUID> {

    Page<ForumTopic> findByCategory(ForumCategory category, Pageable pageable);

    Page<ForumTopic> findByTitleContainingIgnoreCase(String query, Pageable pageable);

    long countByAuthorId(java.util.UUID authorId);
}
