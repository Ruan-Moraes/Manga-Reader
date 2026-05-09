package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mangareader.domain.label.entity.DomainLabel;

/**
 * Spring Data JPA Repository para {@link DomainLabel}.
 */
public interface DomainLabelJpaRepository extends JpaRepository<DomainLabel, Long> {

    List<DomainLabel> findAllByTypeOrderByValueAsc(String type);

    Optional<DomainLabel> findByTypeAndValue(String type, String value);
}
