package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.mangareader.application.forum.port.ForumRepositoryPort;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.infrastructure.persistence.postgres.repository.ForumTopicJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que implementa {@link ForumRepositoryPort} usando Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
public class ForumRepositoryAdapter implements ForumRepositoryPort {
    private final ForumTopicJpaRepository repository;

    @Override
    public Page<ForumTopic> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    @Override
    public Optional<ForumTopic> findById(UUID id) {
        return repository.findById(id);
    }

    @Override
    public Page<ForumTopic> findByCategory(ForumCategory category, Pageable pageable) {
        return repository.findByCategory(category, pageable);
    }

    @Override
    public Page<ForumTopic> searchByTitle(String query, Pageable pageable) {
        return repository.findByTitleContainingIgnoreCase(query, pageable);
    }

    @Override
    public ForumTopic save(ForumTopic topic) {
        return repository.save(topic);
    }

    @Override
    public long countByAuthorId(UUID authorId) {
        return repository.countByAuthorId(authorId);
    }

    @Override
    public void deleteById(UUID id) {
        repository.deleteById(id);
    }
}
