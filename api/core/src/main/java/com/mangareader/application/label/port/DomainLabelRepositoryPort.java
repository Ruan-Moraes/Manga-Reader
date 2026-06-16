package com.mangareader.application.label.port;

import java.util.List;
import java.util.Optional;

import com.mangareader.domain.label.entity.DomainLabel;

/**
 * Port de saída — acesso a dados de {@link DomainLabel} (PostgreSQL).
 */
public interface DomainLabelRepositoryPort {
    List<DomainLabel> findAllByType(String type);

    Optional<DomainLabel> findByTypeAndValue(String type, String value);
}
