package com.mangareader.shared.domain.i18n;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Serialização JSON compartilhada para {@link LocalizedString} e {@link LocalizedStringList}.
 *
 * <p>Usado pelos {@code AttributeConverter} JPA para uniformizar o wire format
 * JSONB sem duplicar try/catch e {@link ObjectMapper}.
 */
public final class LocalizedStringJsonSerde {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, String>> STRING_MAP =
            new TypeReference<>() {};
    private static final TypeReference<Map<String, List<String>>> LIST_MAP =
            new TypeReference<>() {};

    private LocalizedStringJsonSerde() {
    }

    public static String toJson(LocalizedString value) {
        Map<String, String> map = (value == null) ? Map.of() : value.values();
        return writeAsString(map, "LocalizedString");
    }

    public static LocalizedString fromJson(String json) {
        if (json == null || json.isBlank()) {
            return LocalizedString.empty();
        }
        Map<String, String> map = readValue(json, STRING_MAP, "LocalizedString");
        return LocalizedString.of(map);
    }

    public static String toJson(LocalizedStringList value) {
        Map<String, List<String>> map = (value == null) ? Map.of() : value.values();
        return writeAsString(map, "LocalizedStringList");
    }

    public static LocalizedStringList fromJsonList(String json) {
        if (json == null || json.isBlank()) {
            return LocalizedStringList.empty();
        }
        Map<String, List<String>> map = readValue(json, LIST_MAP, "LocalizedStringList");
        return LocalizedStringList.of(map);
    }

    private static String writeAsString(Object map, String label) {
        try {
            return MAPPER.writeValueAsString(map);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao serializar " + label + " para JSONB", e);
        }
    }

    private static <T> T readValue(String json, TypeReference<T> type, String label) {
        try {
            return MAPPER.readValue(json, type);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao desserializar " + label + " de JSONB", e);
        }
    }
}
