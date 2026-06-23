package com.mangareader.application.publisher.port;

import java.util.Collection;
import java.util.List;

import com.mangareader.domain.publisher.entity.TitlePublisher;

/**
 * Port de saída — junção título ↔ editora (PostgreSQL).
 */
public interface TitlePublisherRepositoryPort {
    List<TitlePublisher> findByTitleId(String titleId);

    /** Batch fetch para evitar N+1 ao montar respostas de listagem. */
    List<TitlePublisher> findByTitleIdIn(Collection<String> titleIds);

    TitlePublisher save(TitlePublisher titlePublisher);

    void deleteByTitleId(String titleId);
}
