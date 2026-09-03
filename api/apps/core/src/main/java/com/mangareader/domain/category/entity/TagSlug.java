package com.mangareader.domain.category.entity;

import java.text.Normalizer;

/**
 * Deriva o slug canônico de uma tag (UPPER_SNAKE, ASCII), espelhando a regra do
 * backfill em {@code V31__tags_add_slug.sql}. Acentos removidos, não-alfanumérico
 * vira {@code _}, sem underscores nas pontas. Ex.: {@code "Ficção Científica"} →
 * {@code "FICCAO_CIENTIFICA"}; {@code "Science Fiction"} → {@code "SCIENCE_FICTION"}.
 */
public final class TagSlug {

    private TagSlug() {
    }

    public static String canonical(String source) {
        if (source == null || source.isBlank()) {
            return "";
        }

        String ascii = Normalizer.normalize(source, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");

        return ascii.toUpperCase()
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
    }
}
