package com.mangareader.domain.store.valueobject;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("StoreCategory")
class StoreCategoryTest {

    @Test
    @DisplayName("Deve resolver categorias case-insensitive")
    void deveResolverCaseInsensitive() {
        assertThat(StoreCategory.fromValue("oficial")).isEqualTo(StoreCategory.OFICIAL);
        assertThat(StoreCategory.fromValue("NOVA")).isEqualTo(StoreCategory.NOVA);
        assertThat(StoreCategory.fromValue("Usado")).isEqualTo(StoreCategory.USADO);
    }

    @Test
    @DisplayName("Deve lançar IllegalArgumentException para valor inválido")
    void deveLancarParaInvalido() {
        assertThatThrownBy(() -> StoreCategory.fromValue("antiquario"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("inválida");
    }
}
