package com.mangareader.shared.domain.i18n;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

/**
 * Variante de {@link LocalizedString} para listas (ex.: {@code features[]}, {@code content[]}).
 * Cada language tag mapeia para uma {@code List<String>}.
 */
public final class LocalizedStringList {
    public static final String DEFAULT_TAG = LocalizedString.DEFAULT_TAG;

    private final Map<String, List<String>> values;

    private LocalizedStringList(Map<String, List<String>> values) {
        var copy = new LinkedHashMap<String, List<String>>();

        if (values != null) {
            values.forEach((k, v) -> copy.put(k, List.copyOf(v)));
        }

        this.values = Collections.unmodifiableMap(copy);
    }

    public static LocalizedStringList empty() {
        return new LocalizedStringList(Map.of());
    }

    public static LocalizedStringList of(Map<String, List<String>> values) {
        Objects.requireNonNull(values, "values");

        return new LocalizedStringList(values);
    }

    public static LocalizedStringList ofDefault(List<String> value) {
        Objects.requireNonNull(value, "value");

        return new LocalizedStringList(Map.of(DEFAULT_TAG, value));
    }

    public Map<String, List<String>> values() {
        return values;
    }

    public boolean isEmpty() {
        return values.isEmpty();
    }

    /**
     * Resolve para o locale informado. Cadeia: tag exata → DEFAULT_TAG → primeira lista
     * não vazia → lista vazia.
     */
    public List<String> resolve(Locale locale) {
        if (locale != null) {
            List<String> exact = values.get(locale.toLanguageTag());

            if (exact != null && !exact.isEmpty()) {
                return exact;
            }
        }

        List<String> fallback = values.get(DEFAULT_TAG);

        if (fallback != null && !fallback.isEmpty()) {
            return fallback;
        }

        return values.values().stream()
                .filter(v -> v != null && !v.isEmpty())
                .findFirst()
                .orElse(List.of());
    }

    public LocalizedStringList with(String tag, List<String> value) {
        Objects.requireNonNull(tag, "tag");
        Objects.requireNonNull(value, "value");

        var copy = new LinkedHashMap<>(values);
        copy.put(tag, List.copyOf(value));

        return new LocalizedStringList(copy);
    }

    @Override
    public boolean equals(Object o) {
        return (o instanceof LocalizedStringList other) && values.equals(other.values);
    }

    @Override
    public int hashCode() {
        return values.hashCode();
    }

    @Override
    public String toString() {
        return "LocalizedStringList" + values;
    }
}
