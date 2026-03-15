package com.mangareader.domain.user.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("UserRecommendation")
class UserRecommendationTest {

    @Test
    @DisplayName("Deve iniciar position com 0 no builder padrão")
    void deveIniciarPositionComZeroNoBuilderPadrao() {
        UserRecommendation rec = UserRecommendation.builder()
                .titleId("title-123")
                .titleName("Solo Leveling")
                .build();

        assertEquals(0, rec.getPosition());
    }

    @Test
    @DisplayName("Deve permitir definir todos os campos via builder")
    void devePermitirDefinirTodosOsCamposViaBuilder() {
        UUID id = UUID.randomUUID();
        User user = User.builder()
                .id(UUID.randomUUID())
                .name("Test User")
                .email("test@email.com")
                .passwordHash("hash")
                .build();

        UserRecommendation rec = UserRecommendation.builder()
                .id(id)
                .user(user)
                .titleId("title-abc")
                .titleName("One Piece")
                .titleCover("https://example.com/cover.jpg")
                .position(3)
                .build();

        assertEquals(id, rec.getId());
        assertEquals(user, rec.getUser());
        assertEquals("title-abc", rec.getTitleId());
        assertEquals("One Piece", rec.getTitleName());
        assertEquals("https://example.com/cover.jpg", rec.getTitleCover());
        assertEquals(3, rec.getPosition());
    }

    @Test
    @DisplayName("Construtor vazio deve manter campos nulos e position com valor default do tipo primitivo")
    void construtorVazioDeveManterCamposNulos() {
        UserRecommendation rec = new UserRecommendation();

        assertNull(rec.getId());
        assertNull(rec.getUser());
        assertNull(rec.getTitleId());
        assertNull(rec.getTitleName());
        assertNull(rec.getTitleCover());
        assertNull(rec.getCreatedAt());
        assertEquals(0, rec.getPosition());
    }

    @Test
    @DisplayName("Deve suportar mutação via setters")
    void deveSuportarMutacaoViaSetters() {
        UserRecommendation rec = UserRecommendation.builder()
                .titleId("title-1")
                .titleName("Original")
                .position(0)
                .build();

        rec.setPosition(5);
        rec.setTitleName("Atualizado");

        assertEquals(5, rec.getPosition());
        assertEquals("Atualizado", rec.getTitleName());
    }

    @Test
    @DisplayName("Deve associar recomendação a um usuário")
    void deveAssociarRecomendacaoAUmUsuario() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .name("Ruan")
                .email("ruan@email.com")
                .passwordHash("hash")
                .build();

        UserRecommendation rec = UserRecommendation.builder()
                .user(user)
                .titleId("title-xyz")
                .titleName("Naruto")
                .build();

        assertNotNull(rec.getUser());
        assertEquals(user.getId(), rec.getUser().getId());
    }
}
