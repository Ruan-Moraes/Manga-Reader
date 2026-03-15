package com.mangareader.domain.user.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("UserSocialLink")
class UserSocialLinkTest {

    @Nested
    @DisplayName("Builder")
    class BuilderTests {

        @Test
        @DisplayName("Deve criar instância com todos os campos via builder")
        void shouldBuildWithAllFields() {
            UUID id = UUID.randomUUID();
            User user = User.builder().name("Ruan").email("ruan@test.com").build();

            UserSocialLink link = UserSocialLink.builder()
                    .id(id)
                    .user(user)
                    .platform("Twitter")
                    .url("https://twitter.com/ruan")
                    .build();

            assertEquals(id, link.getId());
            assertEquals(user, link.getUser());
            assertEquals("Twitter", link.getPlatform());
            assertEquals("https://twitter.com/ruan", link.getUrl());
        }

        @Test
        @DisplayName("Deve permitir user null no builder (sem DB)")
        void shouldAllowNullUser() {
            UserSocialLink link = UserSocialLink.builder()
                    .platform("GitHub")
                    .url("https://github.com/ruan")
                    .build();

            assertNull(link.getUser());
            assertNotNull(link.getPlatform());
        }
    }

    @Nested
    @DisplayName("Getters e Setters")
    class GetterSetterTests {

        @Test
        @DisplayName("Deve atualizar campos via setters")
        void shouldUpdateFieldsViaSetters() {
            UserSocialLink link = new UserSocialLink();

            UUID id = UUID.randomUUID();
            link.setId(id);
            link.setPlatform("Instagram");
            link.setUrl("https://instagram.com/ruan");

            assertEquals(id, link.getId());
            assertEquals("Instagram", link.getPlatform());
            assertEquals("https://instagram.com/ruan", link.getUrl());
        }
    }

    @Nested
    @DisplayName("NoArgsConstructor")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Deve criar instância vazia com construtor padrão")
        void shouldCreateEmptyInstance() {
            UserSocialLink link = new UserSocialLink();

            assertNull(link.getId());
            assertNull(link.getUser());
            assertNull(link.getPlatform());
            assertNull(link.getUrl());
        }
    }
}
