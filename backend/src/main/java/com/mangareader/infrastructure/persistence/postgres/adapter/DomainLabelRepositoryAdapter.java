package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.mangareader.application.label.port.DomainLabelRepositoryPort;
import com.mangareader.domain.label.entity.DomainLabel;
import com.mangareader.infrastructure.persistence.postgres.repository.DomainLabelJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta {@link DomainLabelRepositoryPort} ao Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
public class DomainLabelRepositoryAdapter implements DomainLabelRepositoryPort {

    private final DomainLabelJpaRepository jpaRepository;

    @Override
    public List<DomainLabel> findAllByType(String type) {
        return jpaRepository.findAllByTypeOrderByValueAsc(type);
    }

    @Override
    public Optional<DomainLabel> findByTypeAndValue(String type, String value) {
        return jpaRepository.findByTypeAndValue(type, value);
    }
}
