package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.Collection;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;

/**
 * Repositório JPA para tópicos do fórum.
 * <p>
 * Listagens usam {@code @EntityGraph(author)}: {@code author} é
 * {@code @ManyToOne} — fetch via JOIN com paginação é seguro (sem
 * {@code HHH000104}, que só afeta coleções). Evita N+1 de author por tópico.
 */
public interface ForumTopicJpaRepository extends JpaRepository<ForumTopic, UUID> {
    @Override
    @EntityGraph(attributePaths = "author")
    Page<ForumTopic> findAll(Pageable pageable);

    @EntityGraph(attributePaths = "author")
    Page<ForumTopic> findByCategory(ForumCategory category, Pageable pageable);

    Page<ForumTopic> findByLanguage(String language, Pageable pageable);

    @EntityGraph(attributePaths = "author")
    Page<ForumTopic> findByLanguageIn(Collection<String> languages, Pageable pageable);

    Page<ForumTopic> findByCategoryAndLanguage(ForumCategory category, String language, Pageable pageable);

    @EntityGraph(attributePaths = "author")
    Page<ForumTopic> findByCategoryAndLanguageIn(ForumCategory category, Collection<String> languages, Pageable pageable);

    Page<ForumTopic> findByTitleContainingIgnoreCase(String query, Pageable pageable);

    Page<ForumTopic> findByTitleContainingIgnoreCaseAndLanguage(String query, String language, Pageable pageable);

    Page<ForumTopic> findByTitleContainingIgnoreCaseAndLanguageIn(String query, Collection<String> languages, Pageable pageable);

    long countByAuthorId(java.util.UUID authorId);

    /**
     * PERF-6: reconcilia o contador desnormalizado {@code replyCount} com a contagem real
     * de respostas. Bulk update idempotente (SET = COUNT) — corrige drift sem risco de
     * double-count, independentemente dos incrementos feitos pelos use cases.
     */
    @Modifying
    @Query("UPDATE ForumTopic t SET t.replyCount = (SELECT COUNT(r) FROM ForumReply r WHERE r.topic = t)")
    int reconcileReplyCounts();
}
