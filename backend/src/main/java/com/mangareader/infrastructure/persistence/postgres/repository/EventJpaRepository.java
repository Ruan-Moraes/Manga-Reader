package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mangareader.domain.event.entity.Event;
import com.mangareader.domain.event.valueobject.EventStatus;

/**
 * Repositório JPA para eventos.
 */
public interface EventJpaRepository extends JpaRepository<Event, UUID> {
    List<Event> findByStatus(EventStatus status);

    List<Event> findAllByOrderByStartDateDesc();

    Page<Event> findByStatus(EventStatus status, Pageable pageable);

    long countByStatus(EventStatus status);

    /**
     * Busca paginada no banco por substring em qualquer valor do JSONB
     * {@code title} (multilíngue). Native query Postgres ({@code jsonb_each_text}
     * + {@code ILIKE}) — não exercitada por testes H2/@DataJpaTest (H2 não
     * suporta JSONB; cobertura manual contra Postgres real). Substitui o
     * antigo carregamento de todos os eventos em memória.
     */
    @Query(value = """
            SELECT * FROM events e
            WHERE EXISTS (
                SELECT 1 FROM jsonb_each_text(e.title) kv
                WHERE kv.value ILIKE '%' || :q || '%')
            """,
            countQuery = """
            SELECT count(*) FROM events e
            WHERE EXISTS (
                SELECT 1 FROM jsonb_each_text(e.title) kv
                WHERE kv.value ILIKE '%' || :q || '%')
            """,
            nativeQuery = true)
    Page<Event> searchByTitle(@Param("q") String q, Pageable pageable);
}
