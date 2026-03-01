package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mangareader.domain.category.entity.Tag;

/**
 * Spring Data JPA Repository para Tags.
 */
public interface TagJpaRepository extends JpaRepository<Tag, Long> {

    List<Tag> findByLabelContainingIgnoreCase(String query);

    List<Tag> findAllByOrderByLabelAsc();
}
