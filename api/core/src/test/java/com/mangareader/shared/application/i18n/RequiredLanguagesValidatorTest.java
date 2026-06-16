package com.mangareader.shared.application.i18n;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("RequiredLanguagesValidator")
class RequiredLanguagesValidatorTest {

    private final RequiredLanguagesValidator validator = new RequiredLanguagesValidator();

    private RequiredLanguages annotation(String... tags) {
        return new RequiredLanguages() {
            @Override public Class<? extends java.lang.annotation.Annotation> annotationType() { return RequiredLanguages.class; }
            @Override public String[] value() { return tags; }
            @Override public String message() { return "{validation.i18n.requiredLanguages}"; }
            @Override public Class<?>[] groups() { return new Class[0]; }
            @Override public Class<? extends jakarta.validation.Payload>[] payload() { return new Class[0]; }
        };
    }

    @Test
    @DisplayName("Deve aceitar mapa contendo todos os idiomas exigidos")
    void aceitaCompleto() {
        validator.initialize(annotation("pt-BR"));
        var map = Map.of("pt-BR", "Olá", "en-US", "Hello");
        assertThat(validator.isValid(map, null)).isTrue();
    }

    @Test
    @DisplayName("Deve rejeitar mapa null")
    void rejeitaNull() {
        validator.initialize(annotation("pt-BR"));
        assertThat(validator.isValid(null, null)).isFalse();
    }

    @Test
    @DisplayName("Deve rejeitar quando idioma obrigatório está ausente")
    void rejeitaAusente() {
        validator.initialize(annotation("pt-BR"));
        assertThat(validator.isValid(Map.of("en-US", "Hello"), null)).isFalse();
    }

    @Test
    @DisplayName("Deve rejeitar quando idioma obrigatório tem valor em branco")
    void rejeitaEmBranco() {
        validator.initialize(annotation("pt-BR"));
        var map = new HashMap<String, String>();
        map.put("pt-BR", "  ");
        assertThat(validator.isValid(map, null)).isFalse();
    }

    @Test
    @DisplayName("Deve permitir múltiplos idiomas obrigatórios")
    void multiplosObrigatorios() {
        validator.initialize(annotation("pt-BR", "en-US"));
        assertThat(validator.isValid(Map.of("pt-BR", "Olá"), null)).isFalse();
        assertThat(validator.isValid(Map.of("pt-BR", "Olá", "en-US", "Hi"), null)).isTrue();
    }
}
