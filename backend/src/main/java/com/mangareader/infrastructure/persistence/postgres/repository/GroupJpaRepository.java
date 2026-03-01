package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mangareader.domain.group.entity.Group;

/**
 * Spring Data JPA repository para grupos de tradução.
 */
public interface GroupJpaRepository extends JpaRepository<Group, UUID> {

    Optional<Group> findByUsername(String username);

    boolean existsByUsername(String username);
}
