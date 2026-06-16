package com.mangareader.domain.user.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("User.deactivate")
class UserDeactivationTest {

    private User buildUser(UUID id) {
        User user = User.builder()
                .id(id)
                .name("Ruan")
                .email("ruan@email.com")
                .passwordHash("hash")
                .bio("bio")
                .photoUrl("photo")
                .bannerUrl("banner")
                .build();
        user.setSocialLinks(new ArrayList<>(List.of(
                UserSocialLink.builder().platform("twitter").url("x").build())));
        user.setRecommendations(new ArrayList<>(List.of(
                UserRecommendation.builder().titleId("t1").titleName("T1").build())));
        return user;
    }

    @Test
    @DisplayName("Deve anonimizar dados e marcar conta como desativada")
    void deveAnonimizarEDesativar() {
        UUID id = UUID.randomUUID();
        User user = buildUser(id);

        user.deactivate();

        assertThat(user.isDeactivated()).isTrue();
        assertThat(user.getDeactivatedAt()).isNotNull();
        assertThat(user.getName()).isEqualTo("Usuário removido");
        assertThat(user.getEmail()).isEqualTo("deleted+" + id + "@deleted.local");
        assertThat(user.getBio()).isNull();
        assertThat(user.getPhotoUrl()).isNull();
        assertThat(user.getBannerUrl()).isNull();
        assertThat(user.getSocialLinks()).isEmpty();
        assertThat(user.getRecommendations()).isEmpty();
    }

    @Test
    @DisplayName("Deve falhar ao desativar usuário sem id")
    void deveFalharSemId() {
        User user = buildUser(null);

        assertThatThrownBy(user::deactivate)
                .isInstanceOf(IllegalStateException.class);
    }
}
