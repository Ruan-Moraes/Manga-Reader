package com.toonlira.translationgateway.application.port;

import com.toonlira.translationgateway.domain.translation.LanguagePair;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Terms a chapter (an installation's opaque context reference) already translated, per language pair. Terms are page
 * content: they live as long as results do, see V12__chapter_translation_memory.sql.
 */
public interface ChapterMemoryRepository {
    /** Unexpired decided terms (source term -> translation) of the chapter. */
    Map<String, String> find(UUID installationId, UUID contextRef, LanguagePair pair, Instant now);

    /**
     * Stores terms not decided yet (a term another page decided first keeps its translation) and renews the expiry of
     * {@code used} terms already there to {@code expiresAt}.
     */
    void remember(UUID installationId, UUID contextRef, LanguagePair pair, Map<String, String> decided,
                  Iterable<String> used, Instant now, Instant expiresAt);

    /** Deletes up to {@code limit} expired terms; returns how many. */
    int deleteExpired(Instant now, int limit);
}
