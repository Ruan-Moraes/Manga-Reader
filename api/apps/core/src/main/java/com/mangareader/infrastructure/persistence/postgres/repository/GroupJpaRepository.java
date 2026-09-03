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
    interface SearchReferenceProjection {
        String getTitleId();
        String getMatchedText();
    }

    interface GroupWorkReferenceProjection {
        UUID getGroupId();
        String getTitleId();
    }

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

    @Query(value = """
            SELECT DISTINCT gw.title_id AS titleId,
                   COALESCE(g.name ->> 'pt-BR', g.username) AS matchedText
            FROM group_works gw
            JOIN groups g ON g.id = gw.group_id
            WHERE mr_localized_values_search(g.name) LIKE CONCAT('%', :query, '%')
               OR mr_normalize_search(g.username) LIKE CONCAT('%', :query, '%')
            ORDER BY gw.title_id
            """, nativeQuery = true)
    List<SearchReferenceProjection> searchTitleReferences(@Param("query") String query);

    @Query(value = """
            SELECT g.*
            FROM groups g
            WHERE mr_normalize_search(g.username) LIKE CONCAT('%', :query, '%')
               OR EXISTS (
                   SELECT 1 FROM jsonb_each_text(g.name) entry
                   WHERE mr_normalize_search(entry.value) LIKE CONCAT('%', :query, '%')
               )
            ORDER BY CASE
                WHEN EXISTS (
                    SELECT 1 FROM jsonb_each_text(g.name) entry
                    WHERE mr_normalize_search(entry.value) = :query
                ) THEN 0
                WHEN mr_normalize_search(g.username) = :query THEN 0
                WHEN EXISTS (
                    SELECT 1 FROM jsonb_each_text(g.name) entry
                    WHERE mr_normalize_search(entry.value) LIKE CONCAT(:query, '%')
                ) THEN 1
                WHEN mr_normalize_search(g.username) LIKE CONCAT(:query, '%') THEN 1
                ELSE 2
            END, g.popularity DESC, g.username
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM groups g
            WHERE mr_normalize_search(g.username) LIKE CONCAT('%', :query, '%')
               OR EXISTS (
                   SELECT 1 FROM jsonb_each_text(g.name) entry
                   WHERE mr_normalize_search(entry.value) LIKE CONCAT('%', :query, '%')
               )
            """, nativeQuery = true)
    Page<Group> searchCatalog(@Param("query") String query, Pageable pageable);

    @Query(value = """
            SELECT gw.group_id AS groupId, gw.title_id AS titleId
            FROM group_works gw
            WHERE gw.group_id IN :groupIds
            """, nativeQuery = true)
    List<GroupWorkReferenceProjection> findWorkTitleIdsByGroupIds(
            @Param("groupIds") List<UUID> groupIds);

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
            WHERE EXISTS (
                SELECT 1 FROM GroupUser s
                WHERE s.group = g AND s.user.id = :userId
                  AND s.type = com.mangareader.domain.group.valueobject.GroupUserType.SUPPORTER
            )""")
    List<Group> findGroupsBySupporterUserId(@Param("userId") UUID userId);

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
