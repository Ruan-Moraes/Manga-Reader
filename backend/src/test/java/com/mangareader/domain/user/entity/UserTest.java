package com.mangareader.domain.user.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.domain.user.valueobject.VisibilitySetting;

class UserTest {

    @Test
    @DisplayName("Deve iniciar com papel MEMBER e lista de social links vazia no builder padrão")
    void shouldInitializeDefaultValuesWhenUsingBuilder() {
        User user = User.builder()
                .name("User Test")
                .email("user@test.com")
                .passwordHash("hash")
                .build();

        assertEquals(UserRole.MEMBER, user.getRole());
        assertNotNull(user.getSocialLinks());
        assertTrue(user.getSocialLinks().isEmpty());
    }

    @Test
    @DisplayName("Deve iniciar commentVisibility com PUBLIC no builder padrão")
    void shouldInitializeCommentVisibilityAsPublic() {
        User user = User.builder()
                .name("User Test")
                .email("user@test.com")
                .passwordHash("hash")
                .build();

        assertEquals(VisibilitySetting.PUBLIC, user.getCommentVisibility());
    }

    @Test
    @DisplayName("Deve iniciar viewHistoryVisibility com PUBLIC no builder padrão")
    void shouldInitializeViewHistoryVisibilityAsPublic() {
        User user = User.builder()
                .name("User Test")
                .email("user@test.com")
                .passwordHash("hash")
                .build();

        assertEquals(VisibilitySetting.PUBLIC, user.getViewHistoryVisibility());
    }

    @Test
    @DisplayName("Deve iniciar recommendations como lista vazia no builder padrão")
    void shouldInitializeRecommendationsAsEmptyList() {
        User user = User.builder()
                .name("User Test")
                .email("user@test.com")
                .passwordHash("hash")
                .build();

        assertNotNull(user.getRecommendations());
        assertTrue(user.getRecommendations().isEmpty());
    }

    @Test
    @DisplayName("Deve permitir definir bannerUrl via builder")
    void shouldSetBannerUrlViaBuilder() {
        User user = User.builder()
                .name("User Test")
                .email("user@test.com")
                .passwordHash("hash")
                .bannerUrl("https://example.com/banner.jpg")
                .build();

        assertEquals("https://example.com/banner.jpg", user.getBannerUrl());
    }

    @Test
    @DisplayName("Deve permitir sobrescrever visibilidade de comentários no builder")
    void shouldOverrideCommentVisibility() {
        User user = User.builder()
                .name("User Test")
                .email("user@test.com")
                .passwordHash("hash")
                .commentVisibility(VisibilitySetting.PRIVATE)
                .build();

        assertEquals(VisibilitySetting.PRIVATE, user.getCommentVisibility());
    }

    @Test
    @DisplayName("Deve permitir sobrescrever visibilidade do histórico no builder")
    void shouldOverrideViewHistoryVisibility() {
        User user = User.builder()
                .name("User Test")
                .email("user@test.com")
                .passwordHash("hash")
                .viewHistoryVisibility(VisibilitySetting.DO_NOT_TRACK)
                .build();

        assertEquals(VisibilitySetting.DO_NOT_TRACK, user.getViewHistoryVisibility());
    }

    @Test
    @DisplayName("Deve permitir sobrescrever papel no builder")
    void shouldAllowRoleOverrideInBuilder() {
        User user = User.builder()
                .name("Admin")
                .email("admin@test.com")
                .passwordHash("hash")
                .role(UserRole.ADMIN)
                .build();

        assertEquals(UserRole.ADMIN, user.getRole());
    }

    @Test
    @DisplayName("Deve permitir associar links sociais ao usuário")
    void shouldAssociateSocialLinks() {
        User user = User.builder()
                .name("Com Link")
                .email("link@test.com")
                .passwordHash("hash")
                .build();

        UserSocialLink socialLink = UserSocialLink.builder()
                .user(user)
                .platform("github")
                .url("https://github.com/user")
                .build();

        user.setSocialLinks(List.of(socialLink));

        assertEquals(1, user.getSocialLinks().size());
        assertEquals("github", user.getSocialLinks().getFirst().getPlatform());
        assertEquals(user, user.getSocialLinks().getFirst().getUser());
    }

    @Test
    @DisplayName("Deve iniciar banned como false no builder padrão")
    void shouldInitializeBannedAsFalse() {
        User user = User.builder()
                .name("User Test")
                .email("user@test.com")
                .passwordHash("hash")
                .build();

        assertFalse(user.isBanned());
        assertNull(user.getBannedAt());
        assertNull(user.getBannedReason());
        assertNull(user.getBannedUntil());
    }

    @Test
    @DisplayName("Construtor vazio deve manter campos opcionais nulos")
    void shouldKeepOptionalFieldsNullOnNoArgsConstructor() {
        User user = new User();

        assertNull(user.getBio());
        assertNull(user.getPhotoUrl());
        assertNull(user.getBannerUrl());
        assertNull(user.getCreatedAt());
        assertNull(user.getUpdatedAt());
    }
}
