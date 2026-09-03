package com.mangareader.infrastructure.persistence.postgres.converter;

import com.mangareader.shared.domain.i18n.LocalizedStringJsonSerde;
import com.mangareader.shared.domain.i18n.LocalizedStringList;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converte {@link LocalizedStringList} ↔ JSON (String) para colunas JSONB.
 */
@Converter
public class LocalizedStringListJsonConverter
        implements AttributeConverter<LocalizedStringList, String> {

    @Override
    public String convertToDatabaseColumn(LocalizedStringList attribute) {
        return LocalizedStringJsonSerde.toJson(attribute);
    }

    @Override
    public LocalizedStringList convertToEntityAttribute(String dbData) {
        return LocalizedStringJsonSerde.fromJsonList(dbData);
    }
}
