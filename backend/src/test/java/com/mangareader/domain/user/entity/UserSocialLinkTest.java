package com.mangareader.domain.user.entity;

import static org.assertj.core.api.Assertions.assertThat;

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

            assertThat(link.getId()).isEqualTo(id);
            assertThat(link.getUser()).isEqualTo(user);
            assertThat(link.getPlatform()).isEqualTo("Twitter");
            assertThat(link.getUrl()).isEqualTo("https://twitter.com/ruan");
        }

        @Test
        @DisplayName("Deve permitir user null no builder (sem DB)")
        void shouldAllowNullUser() {
            UserSocialLink link = UserSocialLink.builder()
                    .platform("GitHub")
                    .url("https://github.com/ruan")
                    .build();

            assertThat(link.getUser()).isNull();
            assertThat(link.getPlatform()).isNotNull();
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

            assertThat(link.getId()).isEqualTo(id);
            assertThat(link.getPlatform()).isEqualTo("Instagram");
            assertThat(link.getUrl()).isEqualTo("https://instagram.com/ruan");
        }
    }

    @Nested
    @DisplayName("NoArgsConstructor")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Deve criar instância vazia com construtor padrão")
        void shouldCreateEmptyInstance() {
            UserSocialLink link = new UserSocialLink();

            assertThat(link.getId()).isNull();
            assertThat(link.getUser()).isNull();
            assertThat(link.getPlatform()).isNull();
            assertThat(link.getUrl()).isNull();
        }
    }
}
