package com.mangareader.shared.domain.i18n;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Value Object imutável que representa um texto traduzível em múltiplos idiomas.
 *
 * <p>Chaves são BCP 47 language tags (ex.: {@code "pt-BR"}, {@code "en-US"}, {@code "es-ES"}).
 * O fallback obrigatório do sistema é {@link #DEFAULT_TAG}.
 *
 * <p>Persistido como JSONB em PostgreSQL e como subdocumento em MongoDB.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public final class LocalizedString {
    public static final String DEFAULT_TAG = "pt-BR";

    private final Map<String, String> values;

    private LocalizedString(Map<String, String> values) {
        this.values = Collections.unmodifiableMap(
                values == null ? new LinkedHashMap<>() : new LinkedHashMap<>(values));
    }

    public static LocalizedString empty() {
        return new LocalizedString(Map.of());
    }

    public static LocalizedString of(Map<String, String> values) {
        Objects.requireNonNull(values, "values");

        return new LocalizedString(values);
    }

    /** Reconstrução via cache Redis (Jackson). Tolera {@code values} ausente/legado → vazio. */
    @JsonCreator
    static LocalizedString fromJson(@JsonProperty("values") Map<String, String> values) {
        return new LocalizedString(values);
    }

    public static LocalizedString ofDefault(String value) {
        Objects.requireNonNull(value, "value");

        return new LocalizedString(Map.of(DEFAULT_TAG, value));
    }

    @JsonProperty("values")
    public Map<String, String> values() {
        return values;
    }

    @JsonIgnore
    public boolean isEmpty() {
        return values.isEmpty();
    }

    /**
     * Resolve para o locale informado. Aplica cadeia de fallback:
     * <ol>
     *   <li>tag exata ({@code locale.toLanguageTag()})</li>
     *   <li>{@link #DEFAULT_TAG}</li>
     *   <li>primeira tradução disponível</li>
     *   <li>string vazia</li>
     * </ol>
     */
    public String resolve(Locale locale) {
        if (locale != null) {
            String exact = values.get(locale.toLanguageTag());

            if (exact != null && !exact.isBlank()) {
                return exact;
            }
        }

        String fallback = values.get(DEFAULT_TAG);

        if (fallback != null && !fallback.isBlank()) {
            return fallback;
        }

        return values.values().stream()
                .filter(v -> v != null && !v.isBlank())
                .findFirst()
                .orElse("");
    }

    public String resolveOrNull(Locale locale) {
        if (locale == null) {
            return null;
        }

        String exact = values.get(locale.toLanguageTag());

        return (exact != null && !exact.isBlank()) ? exact : null;
    }

    public LocalizedString with(String tag, String value) {
        Objects.requireNonNull(tag, "tag");
        Objects.requireNonNull(value, "value");

        var copy = new LinkedHashMap<>(values);
        copy.put(tag, value);

        return new LocalizedString(copy);
    }

    @Override
    public boolean equals(Object o) {
        return (o instanceof LocalizedString other) && values.equals(other.values);
    }

    @Override
    public int hashCode() {
        return values.hashCode();
    }

    @Override
    public String toString() {
        return "LocalizedString" + values;
    }
}
