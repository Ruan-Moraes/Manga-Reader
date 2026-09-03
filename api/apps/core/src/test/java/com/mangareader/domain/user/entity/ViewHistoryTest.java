package com.mangareader.domain.user.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("ViewHistory")
class ViewHistoryTest {

    @Test
    @DisplayName("Deve permitir definir todos os campos via builder")
    void devePermitirDefinirTodosOsCamposViaBuilder() {
        LocalDateTime now = LocalDateTime.now();

        ViewHistory vh = ViewHistory.builder()
                .id("vh-123")
                .userId("user-abc")
                .titleId("title-xyz")
                .titleName("Solo Leveling")
                .titleCover("https://example.com/cover.jpg")
                .viewedAt(now)
                .build();

        assertThat(vh.getId()).isEqualTo("vh-123");
        assertThat(vh.getUserId()).isEqualTo("user-abc");
        assertThat(vh.getTitleId()).isEqualTo("title-xyz");
        assertThat(vh.getTitleName()).isEqualTo("Solo Leveling");
        assertThat(vh.getTitleCover()).isEqualTo("https://example.com/cover.jpg");
        assertThat(vh.getViewedAt()).isEqualTo(now);
    }

    @Test
    @DisplayName("Construtor vazio deve manter todos os campos nulos")
    void construtorVazioDeveManterCamposNulos() {
        ViewHistory vh = new ViewHistory();

        assertThat(vh.getId()).isNull();
        assertThat(vh.getUserId()).isNull();
        assertThat(vh.getTitleId()).isNull();
        assertThat(vh.getTitleName()).isNull();
        assertThat(vh.getTitleCover()).isNull();
        assertThat(vh.getViewedAt()).isNull();
    }

    @Test
    @DisplayName("Deve suportar mutação via setters")
    void deveSuportarMutacaoViaSetters() {
        ViewHistory vh = ViewHistory.builder()
                .userId("user-1")
                .titleId("title-1")
                .titleName("Original")
                .build();

        LocalDateTime newTime = LocalDateTime.now();
        vh.setTitleName("Atualizado");
        vh.setViewedAt(newTime);

        assertThat(vh.getTitleName()).isEqualTo("Atualizado");
        assertThat(vh.getViewedAt()).isEqualTo(newTime);
    }

    @Test
    @DisplayName("Deve criar entrada de histórico sem id (gerado pelo MongoDB)")
    void deveCriarSemId() {
        ViewHistory vh = ViewHistory.builder()
                .userId("user-abc")
                .titleId("title-xyz")
                .titleName("One Piece")
                .viewedAt(LocalDateTime.now())
                .build();

        assertThat(vh.getId()).isNull();
        assertThat(vh.getUserId()).isNotNull();
        assertThat(vh.getTitleId()).isNotNull();
        assertThat(vh.getViewedAt()).isNotNull();
    }
}
