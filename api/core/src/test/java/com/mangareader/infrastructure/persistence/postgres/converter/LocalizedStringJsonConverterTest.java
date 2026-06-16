package com.mangareader.infrastructure.persistence.postgres.converter;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.mangareader.shared.domain.i18n.LocalizedString;

@DisplayName("LocalizedStringJsonConverter")
class LocalizedStringJsonConverterTest {
    private final LocalizedStringJsonConverter converter = new LocalizedStringJsonConverter();

    @Test
    @DisplayName("Deve serializar e desserializar mantendo todas as traduções")
    void roundTrip() {
        var original = LocalizedString.of(Map.of(
                "pt-BR", "Olá",
                "en-US", "Hello",
                "es-ES", "Hola"));

        String json = converter.convertToDatabaseColumn(original);
        LocalizedString restored = converter.convertToEntityAttribute(json);

        assertThat(restored).isEqualTo(original);
        assertThat(json).contains("\"pt-BR\":\"Olá\"", "\"en-US\":\"Hello\"", "\"es-ES\":\"Hola\"");
    }

    @Test
    @DisplayName("Null no banco deve gerar LocalizedString vazia")
    void nullDoBancoGeraVazia() {
        assertThat(converter.convertToEntityAttribute(null)).isEqualTo(LocalizedString.empty());
        assertThat(converter.convertToEntityAttribute("")).isEqualTo(LocalizedString.empty());
    }

    @Test
    @DisplayName("LocalizedString null deve serializar como objeto vazio")
    void nullEntidadeGeraObjetoVazio() {
        assertThat(converter.convertToDatabaseColumn(null)).isEqualTo("{}");
    }

    @Test
    @DisplayName("Deve preservar caracteres especiais e unicode")
    void unicode() {
        var ls = LocalizedString.of(Map.of(
                "pt-BR", "ação coração",
                "ja-JP", "こんにちは"));

        var restored = converter.convertToEntityAttribute(converter.convertToDatabaseColumn(ls));

        assertThat(restored).isEqualTo(ls);
    }
}
