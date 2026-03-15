package com.mangareader.domain.user.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

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

        assertEquals("vh-123", vh.getId());
        assertEquals("user-abc", vh.getUserId());
        assertEquals("title-xyz", vh.getTitleId());
        assertEquals("Solo Leveling", vh.getTitleName());
        assertEquals("https://example.com/cover.jpg", vh.getTitleCover());
        assertEquals(now, vh.getViewedAt());
    }

    @Test
    @DisplayName("Construtor vazio deve manter todos os campos nulos")
    void construtorVazioDeveManterCamposNulos() {
        ViewHistory vh = new ViewHistory();

        assertNull(vh.getId());
        assertNull(vh.getUserId());
        assertNull(vh.getTitleId());
        assertNull(vh.getTitleName());
        assertNull(vh.getTitleCover());
        assertNull(vh.getViewedAt());
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

        assertEquals("Atualizado", vh.getTitleName());
        assertEquals(newTime, vh.getViewedAt());
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

        assertNull(vh.getId());
        assertNotNull(vh.getUserId());
        assertNotNull(vh.getTitleId());
        assertNotNull(vh.getViewedAt());
    }
}
