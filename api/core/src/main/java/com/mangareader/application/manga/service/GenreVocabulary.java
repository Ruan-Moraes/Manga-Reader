package com.mangareader.application.manga.service;

import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.mangareader.application.category.port.TagRepositoryPort;
import com.mangareader.domain.category.entity.Tag;
import com.mangareader.shared.domain.i18n.LocalizedString;

import lombok.RequiredArgsConstructor;

/**
 * Vocabulário de gêneros (slug → label multilíngue), derivado de {@code tags}.
 * <p>
 * Usado na leitura para resolver os slugs guardados em {@code Title.genres} para
 * o label do locale do request. Cache leve em memória (cardinalidade <100,
 * ver docs/i18n-guide.md) com TTL curto — evita N+1 em listagens.
 */
@Component
@RequiredArgsConstructor
public class GenreVocabulary {
    private static final long TTL_MS = 60_000L;

    private final TagRepositoryPort tagRepository;
    private final AtomicReference<Cached> cache = new AtomicReference<>();

    private record Cached(Map<String, LocalizedString> bySlug, long expiresAt) {}

    /** Mapa slug → label multilíngue. Slug ausente do vocabulário não aparece no mapa. */
    public Map<String, LocalizedString> bySlug() {
        long now = System.currentTimeMillis();

        Cached current = cache.get();

        if (current == null || now > current.expiresAt()) {
            Map<String, LocalizedString> fresh = tagRepository.findAll().stream()
                    .filter(t -> t.getSlug() != null)
                    .collect(Collectors.toMap(Tag::getSlug, Tag::getLabel, (a, b) -> a));

            current = new Cached(fresh, now + TTL_MS);

            cache.set(current);
        }

        return current.bySlug();
    }
}
