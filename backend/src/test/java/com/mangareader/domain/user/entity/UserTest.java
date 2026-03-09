package com.mangareader.domain.user.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.mangareader.domain.user.valueobject.UserRole;

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
    @DisplayName("Construtor vazio deve manter campos opcionais nulos")
    void shouldKeepOptionalFieldsNullOnNoArgsConstructor() {
        User user = new User();

        assertNull(user.getBio());
        assertNull(user.getPhotoUrl());
        assertNull(user.getCreatedAt());
        assertNull(user.getUpdatedAt());
    }
}
