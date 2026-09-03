package com.mangareader.domain.forum.valueobject;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("ForumCategory.fromValue")
class ForumCategoryTest {

    @Test
    @DisplayName("Resolve pelo displayName e pelo nome do enum (case-insensitive)")
    void resolve() {
        assertThat(ForumCategory.fromValue("Recomendações")).isEqualTo(ForumCategory.RECOMENDACOES);
        assertThat(ForumCategory.fromValue("off-topic")).isEqualTo(ForumCategory.OFF_TOPIC);
        assertThat(ForumCategory.fromValue("GERAL")).isEqualTo(ForumCategory.GERAL);
    }

    @Test
    @DisplayName("Lança IllegalArgumentException para valor inválido")
    void lancaParaInvalido() {
        assertThatThrownBy(() -> ForumCategory.fromValue("nope")).isInstanceOf(IllegalArgumentException.class);
    }
}
