package com.mangareader.infrastructure.persistence.postgres.converter;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mangareader.shared.domain.i18n.LocalizedStringList;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converte {@link LocalizedStringList} ↔ JSON (String) para colunas JSONB.
 */
@Converter
public class LocalizedStringListJsonConverter
        implements AttributeConverter<LocalizedStringList, String> {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, List<String>>> MAP_TYPE =
            new TypeReference<>() {};

    @Override
    public String convertToDatabaseColumn(LocalizedStringList attribute) {
        try {
            var values = (attribute == null) ? Map.<String, List<String>>of() : attribute.values();
            return MAPPER.writeValueAsString(values);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao serializar LocalizedStringList para JSONB", e);
        }
    }

    @Override
    public LocalizedStringList convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return LocalizedStringList.empty();
        }
        try {
            Map<String, List<String>> map = MAPPER.readValue(dbData, MAP_TYPE);
            return LocalizedStringList.of(map);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao desserializar LocalizedStringList de JSONB", e);
        }
    }
}
