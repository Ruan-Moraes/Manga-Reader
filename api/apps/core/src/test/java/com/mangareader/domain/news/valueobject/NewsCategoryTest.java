package com.mangareader.domain.news.valueobject;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("NewsCategory.fromValue")
class NewsCategoryTest {

    @Test
    @DisplayName("Resolve pelo displayName e pelo nome do enum (case-insensitive)")
    void resolve() {
        assertThat(NewsCategory.fromValue("Lançamentos")).isEqualTo(NewsCategory.LANCAMENTOS);
        assertThat(NewsCategory.fromValue("lançamentos")).isEqualTo(NewsCategory.LANCAMENTOS);
        assertThat(NewsCategory.fromValue("PRINCIPAIS")).isEqualTo(NewsCategory.PRINCIPAIS);
    }

    @Test
    @DisplayName("Lança IllegalArgumentException para valor inválido")
    void lancaParaInvalido() {
        assertThatThrownBy(() -> NewsCategory.fromValue("nope")).isInstanceOf(IllegalArgumentException.class);
    }
}
