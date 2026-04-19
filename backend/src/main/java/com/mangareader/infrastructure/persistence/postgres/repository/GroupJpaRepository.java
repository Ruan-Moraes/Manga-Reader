package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @Query("SELECT DISTINCT g FROM Group g LEFT JOIN FETCH g.groupUsers gu LEFT JOIN FETCH gu.user WHERE g.id = :id")
    Optional<Group> findByIdWithUsers(@Param("id") UUID id);

    @Query("SELECT DISTINCT g FROM Group g LEFT JOIN FETCH g.groupUsers gu LEFT JOIN FETCH gu.user WHERE g.username = :username")
    Optional<Group> findByUsernameWithUsers(@Param("username") String username);

    @Query("SELECT g.id FROM Group g")
    Page<UUID> findAllIds(Pageable pageable);

    @Query("SELECT DISTINCT g FROM Group g LEFT JOIN FETCH g.groupUsers gu LEFT JOIN FETCH gu.user WHERE g.id IN :ids")
    List<Group> findAllWithUsersByIds(@Param("ids") List<UUID> ids);

    @Query("SELECT DISTINCT g FROM Group g JOIN g.translatedWorks w WHERE w.titleId = :titleId")
    List<Group> findByTitleId(@Param("titleId") String titleId);

    @Query("SELECT DISTINCT g FROM Group g JOIN g.translatedWorks w WHERE w.titleId = :titleId")
    Page<Group> findByTitleId(@Param("titleId") String titleId, Pageable pageable);

    Page<Group> findByNameContainingIgnoreCase(String name, Pageable pageable);
}
