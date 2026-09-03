package com.mangareader.shared.web;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Set;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.mangareader.shared.exception.BusinessRuleException;

@DisplayName("SortValidator")
class SortValidatorTest {

    private static final Set<String> ALLOWED = Set.of("id", "createdAt", "rating");

    @Test
    @DisplayName("Aceita campo na whitelist")
    void aceitaCampoValido() {
        assertThatCode(() -> SortValidator.validate("createdAt", ALLOWED))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Aceita null/blank (default sort no controller)")
    void aceitaNullBlank() {
        assertThatCode(() -> SortValidator.validate(null, ALLOWED)).doesNotThrowAnyException();
        assertThatCode(() -> SortValidator.validate("", ALLOWED)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Rejeita campo fora da whitelist com 400")
    void rejeitaCampoInvalido() {
        assertThatThrownBy(() -> SortValidator.validate("name", ALLOWED))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(e -> {
                    var b = (BusinessRuleException) e;
                    assert b.getStatusCode() == 400;
                });
    }
}
