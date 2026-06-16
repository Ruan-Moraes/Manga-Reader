package com.mangareader.domain.category.entity;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("TagSlug.canonical")
class TagSlugTest {

    @Test
    @DisplayName("Remove acentos e gera UPPER_SNAKE")
    void removeAcentosUpperSnake() {
        assertThat(TagSlug.canonical("Ficção Científica")).isEqualTo("FICCAO_CIENTIFICA");
        assertThat(TagSlug.canonical("Ação")).isEqualTo("ACAO");
    }

    @Test
    @DisplayName("Espaços e não-alfanuméricos viram underscore único")
    void naoAlfanumericoViraUnderscore() {
        assertThat(TagSlug.canonical("Slice of Life")).isEqualTo("SLICE_OF_LIFE");
        assertThat(TagSlug.canonical("Sci-Fi / Mecha")).isEqualTo("SCI_FI_MECHA");
    }

    @Test
    @DisplayName("Sem underscores nas pontas")
    void semUnderscoreNasPontas() {
        assertThat(TagSlug.canonical("  +18!  ")).isEqualTo("18");
        assertThat(TagSlug.canonical("RPG")).isEqualTo("RPG");
    }

    @Test
    @DisplayName("Null ou branco retorna string vazia")
    void nullOuBranco() {
        assertThat(TagSlug.canonical(null)).isEmpty();
        assertThat(TagSlug.canonical("   ")).isEmpty();
    }
}
