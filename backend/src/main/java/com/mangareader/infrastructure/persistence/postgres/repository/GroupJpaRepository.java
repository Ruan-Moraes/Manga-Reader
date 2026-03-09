package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mangareader.domain.group.entity.Group;

/**
 * Spring Data JPA repository para grupos de tradução.
 */
public interface GroupJpaRepository extends JpaRepository<Group, UUID> {

    Optional<Group> findByUsername(String username);

    boolean existsByUsername(String username);

    @Query("SELECT DISTINCT g FROM Group g JOIN g.translatedWorks w WHERE w.titleId = :titleId")
    List<Group> findByTitleId(@Param("titleId") String titleId);
}
