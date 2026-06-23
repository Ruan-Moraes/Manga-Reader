package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.util.Collection;
import java.util.List;

import org.springframework.stereotype.Component;

import com.mangareader.application.author.port.TitleAuthorRepositoryPort;
import com.mangareader.domain.author.entity.TitleAuthor;
import com.mangareader.infrastructure.persistence.postgres.repository.TitleAuthorJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port de TitleAuthor ao Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
public class TitleAuthorRepositoryAdapter implements TitleAuthorRepositoryPort {
    private final TitleAuthorJpaRepository repository;

    @Override
    public List<TitleAuthor> findByTitleId(String titleId) {
        return repository.findByTitleId(titleId);
    }

    @Override
    public List<TitleAuthor> findByTitleIdIn(Collection<String> titleIds) {
        if (titleIds == null || titleIds.isEmpty()) {
            return List.of();
        }
        return repository.findByTitleIdIn(titleIds);
    }

    @Override
    public List<String> findTitleIdsByAuthorId(Long authorId) {
        return repository.findTitleIdsByAuthorId(authorId);
    }

    @Override
    public TitleAuthor save(TitleAuthor titleAuthor) {
        return repository.save(titleAuthor);
    }

    @Override
    public void deleteByTitleId(String titleId) {
        repository.deleteByTitleId(titleId);
    }
}
