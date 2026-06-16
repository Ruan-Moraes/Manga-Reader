package com.mangareader.infrastructure.persistence.postgres.converter;

import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.domain.i18n.LocalizedStringJsonSerde;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converte {@link LocalizedString} ↔ JSON (String) para colunas JSONB.
 *
 * <p>Use junto de {@code @Convert(converter = LocalizedStringJsonConverter.class)} e
 * {@code @JdbcTypeCode(SqlTypes.JSON)} no campo da entidade.
 */
@Converter
public class LocalizedStringJsonConverter implements AttributeConverter<LocalizedString, String> {
    @Override
    public String convertToDatabaseColumn(LocalizedString attribute) {
        return LocalizedStringJsonSerde.toJson(attribute);
    }

    @Override
    public LocalizedString convertToEntityAttribute(String dbData) {
        return LocalizedStringJsonSerde.fromJson(dbData);
    }
}
