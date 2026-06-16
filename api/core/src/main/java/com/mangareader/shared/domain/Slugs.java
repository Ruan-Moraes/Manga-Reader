package com.mangareader.shared.domain;

import java.text.Normalizer;
import java.util.function.Predicate;

/**
 * Deriva slugs canônicos (lowercase, ASCII, separados por hífen) a partir de um
 * nome arbitrário. Acentos removidos, não-alfanumérico vira {@code -}, sem hífens
 * nas pontas. Ex.: {@code "Eiichiro Oda"} → {@code "eiichiro-oda"}.
 * <p>
 * {@link #unique(String, Predicate)} resolve colisões anexando sufixo numérico.
 */
public final class Slugs {

    private Slugs() {
    }

    public static String base(String source) {
        if (source == null || source.isBlank()) {
            return "";
        }

        String ascii = Normalizer.normalize(source, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");

        return ascii.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
    }

    /**
     * Gera um slug único a partir do nome. {@code taken} retorna {@code true} se o
     * slug candidato já existe; nesse caso anexa {@code -2}, {@code -3}, ... até achar
     * um livre.
     */
    public static String unique(String source, Predicate<String> taken) {
        String base = base(source);
        if (base.isEmpty()) {
            base = "n-a";
        }

        if (!taken.test(base)) {
            return base;
        }

        int suffix = 2;
        String candidate = base + "-" + suffix;
        while (taken.test(candidate)) {
            suffix++;
            candidate = base + "-" + suffix;
        }
        return candidate;
    }
}
