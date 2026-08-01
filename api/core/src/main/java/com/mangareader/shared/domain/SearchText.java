package com.mangareader.shared.domain;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Normalização canônica para busca textual, sem alterar o valor exibido.
 */
public final class SearchText {
    public static final int MIN_LENGTH = 2;
    public static final int MAX_LENGTH = 100;

    private static final Pattern DIACRITICS = Pattern.compile("\\p{M}+");
    private static final Pattern NON_ALPHANUMERIC = Pattern.compile("[^\\p{L}\\p{N}\\s]");
    private static final Pattern SPACES = Pattern.compile("\\s+");

    private SearchText() {
    }

    public static String collapseSpaces(String value) {
        return value == null ? "" : SPACES.matcher(value.trim()).replaceAll(" ");
    }

    public static String normalize(String value) {
        var collapsed = collapseSpaces(value).toLowerCase(Locale.ROOT);
        var decomposed = Normalizer.normalize(collapsed, Normalizer.Form.NFD);
        var withoutDiacritics = DIACRITICS.matcher(decomposed).replaceAll("");
        var safe = NON_ALPHANUMERIC.matcher(withoutDiacritics).replaceAll(" ");
        return collapseSpaces(safe);
    }

    public static void requireValid(String value) {
        var normalized = normalize(value);
        if (normalized.length() < MIN_LENGTH || normalized.length() > MAX_LENGTH) {
            throw new IllegalArgumentException("Search query must contain between 2 and 100 characters");
        }
    }
}
