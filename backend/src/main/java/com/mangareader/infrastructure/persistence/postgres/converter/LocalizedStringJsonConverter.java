package com.mangareader.infrastructure.persistence.postgres.converter;

import java.util.Map;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mangareader.shared.domain.i18n.LocalizedString;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converte {@link LocalizedString} ↔ JSON (String) para persistência em colunas JSONB.
 *
 * <p>Use junto de {@code @Convert(converter = LocalizedStringJsonConverter.class)} e
 * {@code @JdbcTypeCode(SqlTypes.JSON)} no campo da entidade.
 */
@Converter
public class LocalizedStringJsonConverter implements AttributeConverter<LocalizedString, String> {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, String>> MAP_TYPE =
            new TypeReference<>() {};

    @Override
    public String convertToDatabaseColumn(LocalizedString attribute) {
        try {
            var values = (attribute == null) ? Map.<String, String>of() : attribute.values();

            return MAPPER.writeValueAsString(values);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao serializar LocalizedString para JSONB", e);
        }
    }

    @Override
    public LocalizedString convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return LocalizedString.empty();
        }
        try {
            Map<String, String> map = MAPPER.readValue(dbData, MAP_TYPE);

            return LocalizedString.of(map);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao desserializar LocalizedString de JSONB", e);
        }
    }
}
