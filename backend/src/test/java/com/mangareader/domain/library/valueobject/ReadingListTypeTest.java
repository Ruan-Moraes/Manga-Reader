package com.mangareader.domain.library.valueobject;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("ReadingListType.fromValue")
class ReadingListTypeTest {

    @Test
    @DisplayName("Resolve pelo displayName (label PT) e pelo nome do enum")
    void resolve() {
        assertThat(ReadingListType.fromValue("Quero Ler")).isEqualTo(ReadingListType.QUERO_LER);
        assertThat(ReadingListType.fromValue("Concluído")).isEqualTo(ReadingListType.CONCLUIDO);
        assertThat(ReadingListType.fromValue("LENDO")).isEqualTo(ReadingListType.LENDO);
    }

    @Test
    @DisplayName("Lança IllegalArgumentException para valor inválido")
    void lancaParaInvalido() {
        assertThatThrownBy(() -> ReadingListType.fromValue("nope")).isInstanceOf(IllegalArgumentException.class);
    }
}
