package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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

    @Query("""
            SELECT DISTINCT g FROM Group g
            LEFT JOIN FETCH g.groupUsers gu
            LEFT JOIN FETCH gu.user
            WHERE EXISTS (
                SELECT 1 FROM GroupUser m
                WHERE m.group = g AND m.user.id = :userId
                  AND m.type = com.mangareader.domain.group.valueobject.GroupUserType.MEMBER
            )""")
    List<Group> findGroupsByMemberUserId(@Param("userId") UUID userId);

    @Query("""
            SELECT DISTINCT g FROM Group g
            LEFT JOIN FETCH g.groupUsers gu
            LEFT JOIN FETCH gu.user
            WHERE NOT EXISTS (
                SELECT 1 FROM GroupUser m
                WHERE m.group = g AND m.user.id = :userId
                  AND m.type = com.mangareader.domain.group.valueobject.GroupUserType.MEMBER
            )""")
    List<Group> findAvailableGroupsForUser(@Param("userId") UUID userId);

    /** IDs dos grupos que têm obra referenciando o título (antes de removê-las). */
    @Query("SELECT DISTINCT w.group.id FROM GroupWork w WHERE w.titleId = :titleId")
    List<UUID> findGroupIdsByWorkTitleId(@Param("titleId") String titleId);

    /** Remove de todos os grupos as obras que referenciam o título (limpeza de órfão cross-DB). */
    @Modifying
    @Query("DELETE FROM GroupWork w WHERE w.titleId = :titleId")
    int deleteWorksByTitleId(@Param("titleId") String titleId);

    /** Recalcula {@code total_titles} dos grupos informados a partir das obras restantes. */
    @Modifying
    @Query("UPDATE Group g SET g.totalTitles = (SELECT COUNT(w) FROM GroupWork w WHERE w.group = g) WHERE g.id IN :ids")
    int reconcileTotalTitlesForIds(@Param("ids") List<UUID> ids);

}
