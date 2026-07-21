package com.mangareader.domain.news.valueobject;

import java.text.Normalizer;
import java.util.Locale;

public final class NewsSlug {
    private NewsSlug() {}

    public static String from(String value) {
        if (value == null) return "noticia";
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return normalized.isBlank() ? "noticia" : normalized;
    }
}
