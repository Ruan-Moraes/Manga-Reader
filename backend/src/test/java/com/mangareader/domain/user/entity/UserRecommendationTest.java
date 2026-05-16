package com.mangareader.domain.user.entity;

import static org.assertj.core.api.Assertions.assertThat;

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

        assertThat(rec.getPosition()).isEqualTo(0);
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

        assertThat(rec.getId()).isEqualTo(id);
        assertThat(rec.getUser()).isEqualTo(user);
        assertThat(rec.getTitleId()).isEqualTo("title-abc");
        assertThat(rec.getTitleName()).isEqualTo("One Piece");
        assertThat(rec.getTitleCover()).isEqualTo("https://example.com/cover.jpg");
        assertThat(rec.getPosition()).isEqualTo(3);
    }

    @Test
    @DisplayName("Construtor vazio deve manter campos nulos e position com valor default do tipo primitivo")
    void construtorVazioDeveManterCamposNulos() {
        UserRecommendation rec = new UserRecommendation();

        assertThat(rec.getId()).isNull();
        assertThat(rec.getUser()).isNull();
        assertThat(rec.getTitleId()).isNull();
        assertThat(rec.getTitleName()).isNull();
        assertThat(rec.getTitleCover()).isNull();
        assertThat(rec.getCreatedAt()).isNull();
        assertThat(rec.getPosition()).isEqualTo(0);
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

        assertThat(rec.getPosition()).isEqualTo(5);
        assertThat(rec.getTitleName()).isEqualTo("Atualizado");
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

        assertThat(rec.getUser()).isNotNull();
        assertThat(rec.getUser().getId()).isEqualTo(user.getId());
    }
}
