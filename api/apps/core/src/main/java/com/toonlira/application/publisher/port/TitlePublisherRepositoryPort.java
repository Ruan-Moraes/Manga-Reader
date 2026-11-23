package com.toonlira.application.publisher.port;

import java.util.Collection;
import java.util.List;

import com.toonlira.domain.publisher.entity.TitlePublisher;
import com.toonlira.application.manga.port.TitleReferenceMatch;

/**
 * Port de saída — junção título ↔ editora (PostgreSQL).
 */
public interface TitlePublisherRepositoryPort {
    List<TitlePublisher> findByTitleId(String titleId);

    /** Batch fetch para evitar N+1 ao montar respostas de listagem. */
    List<TitlePublisher> findByTitleIdIn(Collection<String> titleIds);

    List<String> findTitleIdsByPublisherId(Long publisherId);

    List<TitlePublisher> findByPublisherIdIn(Collection<Long> publisherIds);

    List<TitleReferenceMatch> searchTitleReferences(String query);

    TitlePublisher save(TitlePublisher titlePublisher);

    void deleteByTitleId(String titleId);
}
