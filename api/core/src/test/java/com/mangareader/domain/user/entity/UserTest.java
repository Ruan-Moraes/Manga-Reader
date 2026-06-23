package com.mangareader.domain.user.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

import java.util.Collections;
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

        assertThat(user.getRole()).isEqualTo(UserRole.MEMBER);
        assertThat(user.getSocialLinks()).isNotNull();
        assertThat(user.getSocialLinks().isEmpty()).isTrue();
    }

    @Test
    @DisplayName("Deve iniciar recommendations como lista vazia no builder padrão")
    void shouldInitializeRecommendationsAsEmptyList() {
        User user = User.builder()
                .name("User Test")
                .email("user@test.com")
                .passwordHash("hash")
                .build();

        assertThat(user.getRecommendations()).isNotNull();
        assertThat(user.getRecommendations().isEmpty()).isTrue();
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

        assertThat(user.getBannerUrl()).isEqualTo("https://example.com/banner.jpg");
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

        assertThat(user.getRole()).isEqualTo(UserRole.ADMIN);
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

        assertThat(user.getSocialLinks().size()).isEqualTo(1);
        assertThat(user.getSocialLinks().getFirst().getPlatform()).isEqualTo("github");
        assertThat(user.getSocialLinks().getFirst().getUser()).isEqualTo(user);
    }

    @Test
    @DisplayName("Deve iniciar banned como false no builder padrão")
    void shouldInitializeBannedAsFalse() {
        User user = User.builder()
                .name("User Test")
                .email("user@test.com")
                .passwordHash("hash")
                .build();

        assertThat(user.isBanned()).isFalse();
        assertThat(user.getBannedAt()).isNull();
        assertThat(user.getBannedReason()).isNull();
        assertThat(user.getBannedUntil()).isNull();
    }

    @Test
    @DisplayName("Deve iniciar contentLocales com [pt-BR] no builder padrão")
    void shouldInitializeContentLocalesDefault() {
        User user = User.builder()
                .name("User Test")
                .email("user@test.com")
                .passwordHash("hash")
                .build();

        assertThat(user.getContentLocales()).isEqualTo(List.of("pt-BR"));
    }

    @Test
    @DisplayName("updateContentLocales deve normalizar tags BCP 47")
    void shouldNormalizeLocaleTags() {
        User user = User.builder()
                .name("User Test")
                .email("user@test.com")
                .passwordHash("hash")
                .build();

        user.updateContentLocales(List.of("PT-br", "es-ES"));

        assertThat(user.getContentLocales()).isEqualTo(List.of("pt-BR", "es-ES"));
    }

    @Test
    @DisplayName("updateContentLocales deve rejeitar lista vazia")
    void shouldRejectEmptyContentLocales() {
        User user = User.builder().name("X").email("x@x.com").passwordHash("h").build();

        assertThatExceptionOfType(IllegalArgumentException.class).isThrownBy(() -> user.updateContentLocales(Collections.emptyList()));
    }

    @Test
    @DisplayName("updateContentLocales deve rejeitar tag inválida")
    void shouldRejectInvalidTag() {
        User user = User.builder().name("X").email("x@x.com").passwordHash("h").build();

        assertThatExceptionOfType(IllegalArgumentException.class).isThrownBy(() -> user.updateContentLocales(List.of("not_a_locale!!!")));
    }

    @Test
    @DisplayName("Deve iniciar favoriteGenres vazio no builder padrão")
    void shouldInitializeFavoriteGenresEmpty() {
        User user = User.builder().name("X").email("x@x.com").passwordHash("h").build();

        assertThat(user.getFavoriteGenres()).isEmpty();
    }

    @Test
    @DisplayName("updateFavoriteGenres deve remover duplicatas preservando a ordem")
    void shouldDedupeFavoriteGenres() {
        User user = User.builder().name("X").email("x@x.com").passwordHash("h").build();

        user.updateFavoriteGenres(List.of("acao", "aventura", "acao"));

        assertThat(user.getFavoriteGenres()).containsExactly("acao", "aventura");
    }

    @Test
    @DisplayName("updateFavoriteGenres deve aparar espacos antes de persistir")
    void shouldTrimFavoriteGenres() {
        User user = User.builder().name("X").email("x@x.com").passwordHash("h").build();

        user.updateFavoriteGenres(List.of(" acao ", "aventura"));

        assertThat(user.getFavoriteGenres()).containsExactly("acao", "aventura");
    }

    @Test
    @DisplayName("updateFavoriteGenres deve aceitar lista vazia (limpa a seleção)")
    void shouldAcceptEmptyFavoriteGenres() {
        User user = User.builder().name("X").email("x@x.com").passwordHash("h").build();

        user.updateFavoriteGenres(List.of("acao"));
        user.updateFavoriteGenres(Collections.emptyList());

        assertThat(user.getFavoriteGenres()).isEmpty();
    }

    @Test
    @DisplayName("updateFavoriteGenres deve rejeitar entrada em branco")
    void shouldRejectBlankFavoriteGenre() {
        User user = User.builder().name("X").email("x@x.com").passwordHash("h").build();

        assertThatExceptionOfType(IllegalArgumentException.class).isThrownBy(() -> user.updateFavoriteGenres(List.of("acao", "  ")));
    }

    @Test
    @DisplayName("updateFavoriteGenres deve rejeitar acima do limite")
    void shouldRejectTooManyFavoriteGenres() {
        User user = User.builder().name("X").email("x@x.com").passwordHash("h").build();

        List<String> tooMany = java.util.stream.IntStream.rangeClosed(1, User.MAX_FAVORITE_GENRES + 1)
                .mapToObj(i -> "g" + i)
                .toList();

        assertThatExceptionOfType(IllegalArgumentException.class).isThrownBy(() -> user.updateFavoriteGenres(tooMany));
    }

    @Test
    @DisplayName("Construtor vazio deve manter campos opcionais nulos")
    void shouldKeepOptionalFieldsNullOnNoArgsConstructor() {
        User user = new User();

        assertThat(user.getBio()).isNull();
        assertThat(user.getPhotoUrl()).isNull();
        assertThat(user.getBannerUrl()).isNull();
        assertThat(user.getCreatedAt()).isNull();
        assertThat(user.getUpdatedAt()).isNull();
    }
}
