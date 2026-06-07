package com.mangareader.domain.rating.valueobject;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("VoteValue")
class VoteValueTest {

    @Test
    @DisplayName("Deve resolver 'up'/'down' case-insensitive")
    void deveResolverCaseInsensitive() {
        assertThat(VoteValue.fromValue("up")).isEqualTo(VoteValue.UP);
        assertThat(VoteValue.fromValue("UP")).isEqualTo(VoteValue.UP);
        assertThat(VoteValue.fromValue("Down")).isEqualTo(VoteValue.DOWN);
    }

    @Test
    @DisplayName("Deve lançar IllegalArgumentException para valor inválido")
    void deveLancarParaInvalido() {
        assertThatThrownBy(() -> VoteValue.fromValue("sideways"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("inválido");
    }
}
