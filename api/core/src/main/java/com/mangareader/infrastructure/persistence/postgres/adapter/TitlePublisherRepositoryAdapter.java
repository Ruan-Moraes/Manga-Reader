package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.util.Collection;
import java.util.List;

import org.springframework.stereotype.Component;

import com.mangareader.application.publisher.port.TitlePublisherRepositoryPort;
import com.mangareader.domain.publisher.entity.TitlePublisher;
import com.mangareader.infrastructure.persistence.postgres.repository.TitlePublisherJpaRepository;
import com.mangareader.application.manga.port.TitleReferenceMatch;
import com.mangareader.domain.manga.valueobject.TitleSearchMatchType;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port de TitlePublisher ao Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
public class TitlePublisherRepositoryAdapter implements TitlePublisherRepositoryPort {
    private final TitlePublisherJpaRepository repository;

    @Override
    public List<TitlePublisher> findByTitleId(String titleId) {
        return repository.findByTitleId(titleId);
    }

    @Override
    public List<TitlePublisher> findByTitleIdIn(Collection<String> titleIds) {
        if (titleIds == null || titleIds.isEmpty()) {
            return List.of();
        }
        return repository.findByTitleIdIn(titleIds);
    }

    @Override
    public List<String> findTitleIdsByPublisherId(Long publisherId) {
        return repository.findTitleIdsByPublisherId(publisherId);
    }

    @Override
    public List<TitlePublisher> findByPublisherIdIn(Collection<Long> publisherIds) {
        return publisherIds == null || publisherIds.isEmpty()
                ? List.of()
                : repository.findByPublisherIdIn(publisherIds);
    }

    @Override
    public List<TitleReferenceMatch> searchTitleReferences(String query) {
        if (query == null || query.isBlank()) return List.of();

        return repository.searchTitleReferences(query).stream()
                .map(match -> new TitleReferenceMatch(
                        match.getTitleId(),
                        TitleSearchMatchType.PUBLISHER,
                        match.getMatchedText()))
                .toList();
    }

    @Override
    public TitlePublisher save(TitlePublisher titlePublisher) {
        return repository.save(titlePublisher);
    }

    @Override
    public void deleteByTitleId(String titleId) {
        repository.deleteByTitleId(titleId);
    }
}
