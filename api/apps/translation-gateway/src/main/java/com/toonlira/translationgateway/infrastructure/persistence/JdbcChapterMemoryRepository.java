package com.toonlira.translationgateway.infrastructure.persistence;

import com.toonlira.translationgateway.application.port.ChapterMemoryRepository;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** translation_context_terms (V14). Every statement is scoped by installation and context. */
@Repository
public class JdbcChapterMemoryRepository implements ChapterMemoryRepository {
    private final JdbcClient jdbc;

    public JdbcChapterMemoryRepository(JdbcClient jdbc) { this.jdbc = jdbc; }

    @Override
    public Map<String, String> find(UUID installationId, UUID contextRef, LanguagePair pair, Instant now) {
        var terms = new HashMap<String, String>();
        jdbc.sql("""
                SELECT source_term, target_term FROM translation_context_terms
                WHERE installation_id = :installation AND context_ref = :context
                  AND source_language = :source AND target_language = :target AND expires_at > :now
                """).param("installation", installationId).param("context", contextRef)
            .param("source", pair.source()).param("target", pair.target()).param("now", Timestamp.from(now))
            .query(row -> { terms.put(row.getString("source_term"), row.getString("target_term")); });
        return Map.copyOf(terms);
    }

    @Override
    public void remember(UUID installationId, UUID contextRef, LanguagePair pair, Map<String, String> decided,
                         Iterable<String> used, Instant now, Instant expiresAt) {
        for (var entry : decided.entrySet()) {
            // First decision wins: a page that decided the term first keeps it; an expired row is replaced.
            jdbc.sql("""
                    INSERT INTO translation_context_terms (installation_id, context_ref, source_language, target_language,
                                                           source_term, target_term, created_at, expires_at)
                    VALUES (:installation, :context, :source, :target, :term, :translation, :now, :expires)
                    ON CONFLICT (installation_id, context_ref, source_language, target_language, source_term) DO UPDATE
                    SET target_term = EXCLUDED.target_term, created_at = EXCLUDED.created_at, expires_at = EXCLUDED.expires_at
                    WHERE translation_context_terms.expires_at <= :now
                    """).param("installation", installationId).param("context", contextRef)
                .param("source", pair.source()).param("target", pair.target())
                .param("term", entry.getKey()).param("translation", entry.getValue())
                .param("now", Timestamp.from(now)).param("expires", Timestamp.from(expiresAt)).update();
        }
        for (var term : used) {
            // Renewed only by a later page using it again, never past a day after it was decided.
            jdbc.sql("""
                    UPDATE translation_context_terms SET expires_at = LEAST(GREATEST(expires_at, :expires),
                                                                            created_at + interval '1 day')
                    WHERE installation_id = :installation AND context_ref = :context AND source_language = :source
                      AND target_language = :target AND source_term = :term AND expires_at > :now
                    """).param("installation", installationId).param("context", contextRef)
                .param("source", pair.source()).param("target", pair.target()).param("term", term)
                .param("now", Timestamp.from(now)).param("expires", Timestamp.from(expiresAt)).update();
        }
    }

    @Override
    public void forget(UUID installationId, UUID contextRef, LanguagePair pair, java.util.Collection<String> terms) {
        if (terms.isEmpty()) return;
        jdbc.sql("""
                DELETE FROM translation_context_terms
                WHERE installation_id = :installation AND context_ref = :context AND source_language = :source
                  AND target_language = :target AND source_term IN (:terms)
                """).param("installation", installationId).param("context", contextRef)
            .param("source", pair.source()).param("target", pair.target()).param("terms", terms).update();
    }

    @Override
    public int deleteExpired(Instant now, int limit) {
        return jdbc.sql("""
                DELETE FROM translation_context_terms WHERE ctid IN (
                    SELECT ctid FROM translation_context_terms WHERE expires_at <= :now LIMIT :limit)
                """).param("now", Timestamp.from(now)).param("limit", limit).update();
    }
}
