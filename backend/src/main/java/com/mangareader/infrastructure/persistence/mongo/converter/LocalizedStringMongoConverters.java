package com.mangareader.infrastructure.persistence.mongo.converter;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.bson.Document;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.data.convert.WritingConverter;

import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.domain.i18n.LocalizedStringList;

/**
 * Converters Spring Data MongoDB ↔ {@link LocalizedString}/{@link LocalizedStringList}.
 *
 * <p>Persistência usa documento flat (chave BCP 47 → valor) para alinhar com a
 * pré-existente convenção de migração ({@code V004}/{@code V006}) e suportar
 * busca por subcampo (ex.: {@code name.pt-BR}).
 */
public final class LocalizedStringMongoConverters {

    private LocalizedStringMongoConverters() {
    }

    @WritingConverter
    public static class LocalizedStringWriter implements Converter<LocalizedString, Document> {
        @Override
        public Document convert(LocalizedString source) {
            return new Document(source.values());
        }
    }

    @ReadingConverter
    public static class LocalizedStringReader implements Converter<Document, LocalizedString> {
        @Override
        public LocalizedString convert(Document source) {
            if (source == null || source.isEmpty()) return LocalizedString.empty();
            Map<String, String> map = new LinkedHashMap<>();
            source.forEach((k, v) -> {
                if (v != null) map.put(k, v.toString());
            });
            return LocalizedString.of(map);
        }
    }

    @WritingConverter
    public static class LocalizedStringListWriter implements Converter<LocalizedStringList, Document> {
        @Override
        public Document convert(LocalizedStringList source) {
            return new Document(source.values());
        }
    }

    @ReadingConverter
    @SuppressWarnings("unchecked")
    public static class LocalizedStringListReader implements Converter<Document, LocalizedStringList> {
        @Override
        public LocalizedStringList convert(Document source) {
            if (source == null || source.isEmpty()) return LocalizedStringList.empty();
            Map<String, List<String>> map = new LinkedHashMap<>();
            source.forEach((k, v) -> {
                if (v instanceof List<?> list) {
                    map.put(k, list.stream().map(Object::toString).toList());
                }
            });
            return LocalizedStringList.of(map);
        }
    }
}
