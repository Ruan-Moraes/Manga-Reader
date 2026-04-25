package com.mangareader.shared.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Locale;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.MessageSource;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(classes = I18nConfig.class)
@ActiveProfiles("test")
@DisplayName("I18nConfig — MessageSource")
class I18nConfigTest {

    @Autowired
    private MessageSource messageSource;

    @Test
    @DisplayName("Deve resolver mensagem de validação em pt-BR por padrão")
    void deveResolverMensagemEmPortugues() {
        String message = messageSource.getMessage(
                "validation.email.required", null, Locale.forLanguageTag("pt-BR"));

        assertThat(message).contains("E-mail");
        assertThat(message).containsIgnoringCase("obrigatório");
    }

    @Test
    @DisplayName("Deve resolver mensagem de validação em en-US")
    void deveResolverMensagemEmIngles() {
        String message = messageSource.getMessage(
                "validation.email.required", null, Locale.forLanguageTag("en-US"));

        assertThat(message).isEqualTo("Email is required.");
    }

    @Test
    @DisplayName("Deve resolver mensagem de validação em es-ES")
    void deveResolverMensagemEmEspanhol() {
        String message = messageSource.getMessage(
                "validation.email.required", null, Locale.forLanguageTag("es-ES"));

        assertThat(message).contains("correo electrónico");
        assertThat(message).containsIgnoringCase("obligatorio");
    }

    @Test
    @DisplayName("Deve resolver security.unauthorized em diferentes idiomas")
    void deveResolverSecurityUnauthorized() {
        String pt = messageSource.getMessage("security.unauthorized", null, Locale.forLanguageTag("pt-BR"));
        String en = messageSource.getMessage("security.unauthorized", null, Locale.forLanguageTag("en-US"));
        String es = messageSource.getMessage("security.unauthorized", null, Locale.forLanguageTag("es-ES"));

        assertThat(pt).containsIgnoringCase("autenticação");
        assertThat(en).contains("Authentication required");
        assertThat(es).containsIgnoringCase("autenticación");
    }
}
