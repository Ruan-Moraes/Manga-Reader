package com.mangareader.domain.errorlog.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("ErrorLog")
class ErrorLogTest {
    @Test
    @DisplayName("Deve criar ErrorLog via builder com todos os campos")
    void deveCriarErrorLogViaBuilder() {
        var now = LocalDateTime.now();

        var errorLog = ErrorLog.builder()
                .id("err-1")
                .message("Cannot read property 'x' of undefined")
                .stackTrace("TypeError: Cannot read property 'x' of undefined\n    at Component.render")
                .source("error-boundary")
                .url("/Manga-Reader/titles/123")
                .userAgent("Mozilla/5.0")
                .userId("user-abc")
                .createdAt(now)
                .build();

        assertThat(errorLog.getId()).isEqualTo("err-1");
        assertThat(errorLog.getMessage()).isEqualTo("Cannot read property 'x' of undefined");
        assertThat(errorLog.getStackTrace()).contains("TypeError");
        assertThat(errorLog.getSource()).isEqualTo("error-boundary");
        assertThat(errorLog.getUrl()).isEqualTo("/Manga-Reader/titles/123");
        assertThat(errorLog.getUserAgent()).isEqualTo("Mozilla/5.0");
        assertThat(errorLog.getUserId()).isEqualTo("user-abc");
        assertThat(errorLog.getCreatedAt()).isEqualTo(now);
    }

    @Test
    @DisplayName("Deve criar ErrorLog com campos opcionais nulos")
    void deveCriarComCamposOpcionaisNulos() {
        var errorLog = ErrorLog.builder()
                .message("Unhandled rejection")
                .source("unhandled-rejection")
                .build();

        assertThat(errorLog.getMessage()).isEqualTo("Unhandled rejection");
        assertThat(errorLog.getSource()).isEqualTo("unhandled-rejection");
        assertThat(errorLog.getStackTrace()).isNull();
        assertThat(errorLog.getUrl()).isNull();
        assertThat(errorLog.getUserAgent()).isNull();
        assertThat(errorLog.getUserId()).isNull();
        assertThat(errorLog.getCreatedAt()).isNull();
    }

    @Test
    @DisplayName("Deve criar ErrorLog via construtor sem argumentos")
    void deveCriarViaConstrutorSemArgumentos() {
        var errorLog = new ErrorLog();

        assertThat(errorLog.getId()).isNull();
        assertThat(errorLog.getMessage()).isNull();
    }

    @Test
    @DisplayName("Deve permitir setters")
    void devePermitirSetters() {
        var errorLog = new ErrorLog();

        errorLog.setMessage("Test error");
        errorLog.setSource("window-error");

        assertThat(errorLog.getMessage()).isEqualTo("Test error");
        assertThat(errorLog.getSource()).isEqualTo("window-error");
    }
}
