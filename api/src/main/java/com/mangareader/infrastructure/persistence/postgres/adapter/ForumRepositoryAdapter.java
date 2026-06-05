package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.util.Collection;
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
    public Page<ForumTopic> findByLanguage(String language, Pageable pageable) {
        return repository.findByLanguage(language, pageable);
    }

    @Override
    public Page<ForumTopic> findByLanguageIn(Collection<String> languages, Pageable pageable) {
        return repository.findByLanguageIn(languages, pageable);
    }

    @Override
    public Page<ForumTopic> findByCategory(ForumCategory category, Pageable pageable) {
        return repository.findByCategory(category, pageable);
    }

    @Override
    public Page<ForumTopic> findByCategoryAndLanguage(ForumCategory category, String language, Pageable pageable) {
        return repository.findByCategoryAndLanguage(category, language, pageable);
    }

    @Override
    public Page<ForumTopic> findByCategoryAndLanguageIn(ForumCategory category, Collection<String> languages, Pageable pageable) {
        return repository.findByCategoryAndLanguageIn(category, languages, pageable);
    }

    @Override
    public Page<ForumTopic> searchByTitle(String query, Pageable pageable) {
        return repository.findByTitleContainingIgnoreCase(query, pageable);
    }

    @Override
    public Page<ForumTopic> searchByTitleAndLanguage(String query, String language, Pageable pageable) {
        return repository.findByTitleContainingIgnoreCaseAndLanguage(query, language, pageable);
    }

    @Override
    public Page<ForumTopic> searchByTitleAndLanguageIn(String query, Collection<String> languages, Pageable pageable) {
        return repository.findByTitleContainingIgnoreCaseAndLanguageIn(query, languages, pageable);
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
