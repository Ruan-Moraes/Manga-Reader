package com.mangareader.infrastructure.persistence.mongo.repository;

import java.util.Collection;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;

/**
 * Spring Data MongoDB repository para tópicos do fórum.
 */
public interface ForumTopicMongoRepository extends MongoRepository<ForumTopic, String> {
    Page<ForumTopic> findByLanguageIn(Collection<String> languages, Pageable pageable);

    Page<ForumTopic> findByCategory(ForumCategory category, Pageable pageable);

    Page<ForumTopic> findByCategoryAndLanguageIn(ForumCategory category, Collection<String> languages, Pageable pageable);

    long countByAuthorId(String authorId);
}
