package com.mangareader.application.manga.service;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

import com.mangareader.domain.manga.valueobject.TitleAlias;
import com.mangareader.domain.manga.valueobject.TitleSearchIndex;
import com.mangareader.shared.domain.SearchText;
import com.mangareader.shared.domain.i18n.LocalizedString;

public final class TitleSearchText {
    public static final int MIN_LENGTH = SearchText.MIN_LENGTH;
    public static final int MAX_LENGTH = SearchText.MAX_LENGTH;

    private TitleSearchText() {
    }

    public static String collapseSpaces(String value) {
        return SearchText.collapseSpaces(value);
    }

    public static String normalize(String value) {
        return SearchText.normalize(value);
    }

    public static List<String> grams(String normalizedValue) {
        var value = normalize(normalizedValue);
        if (value.length() < MIN_LENGTH) return List.of();

        var result = new LinkedHashSet<String>();
        for (int index = 0; index < value.length() - 1; index++) {
            result.add(value.substring(index, index + 2));
        }
        return List.copyOf(result);
    }

    public static TitleSearchIndex buildIndex(LocalizedString names) {
        return buildIndex(names, List.of());
    }

    public static TitleSearchIndex buildIndex(LocalizedString names, List<TitleAlias> aliases) {
        Map<String, String> normalizedNames = new LinkedHashMap<>();
        var normalizedAliases = new LinkedHashSet<String>();
        var grams = new LinkedHashSet<String>();

        if (names != null) {
            names.values().forEach((locale, name) -> {
                var normalized = normalize(name);
                if (!normalized.isBlank()) {
                    normalizedNames.put(locale, normalized);
                    grams.addAll(grams(normalized));
                }
            });
        }

        if (aliases != null) {
            aliases.stream()
                    .filter(alias -> alias != null && alias.getName() != null)
                    .map(alias -> normalize(alias.getName()))
                    .filter(alias -> !alias.isBlank())
                    .forEach(alias -> {
                        normalizedAliases.add(alias);
                        grams.addAll(grams(alias));
                    });
        }

        return TitleSearchIndex.builder()
                .normalizedNames(Map.copyOf(normalizedNames))
                .normalizedAliases(List.copyOf(normalizedAliases))
                .grams(List.copyOf(grams))
                .build();
    }
}
