package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.Collection;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.mangareader.application.forum.port.ForumRepositoryPort;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.infrastructure.persistence.mongo.repository.ForumTopicMongoRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port do fórum ao Spring Data MongoDB.
 */
@Component
@RequiredArgsConstructor
public class ForumRepositoryAdapter implements ForumRepositoryPort {
    private final ForumTopicMongoRepository repository;

    @Override
    public Page<ForumTopic> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    @Override
    public Page<ForumTopic> findByLanguageIn(Collection<String> languages, Pageable pageable) {
        return repository.findByLanguageIn(languages, pageable);
    }

    @Override
    public Optional<ForumTopic> findById(String id) {
        return repository.findById(id);
    }

    @Override
    public Page<ForumTopic> findByCategory(ForumCategory category, Pageable pageable) {
        return repository.findByCategory(category, pageable);
    }

    @Override
    public Page<ForumTopic> findByCategoryAndLanguageIn(ForumCategory category, Collection<String> languages, Pageable pageable) {
        return repository.findByCategoryAndLanguageIn(category, languages, pageable);
    }

    @Override
    public ForumTopic save(ForumTopic topic) {
        return repository.save(topic);
    }

    @Override
    public long countByAuthorId(String authorId) {
        return repository.countByAuthorId(authorId);
    }

    @Override
    public void deleteById(String id) {
        repository.deleteById(id);
    }
}
