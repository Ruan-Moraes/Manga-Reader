package com.mangareader.domain.user.entity;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.mangareader.domain.user.valueobject.AdultContentPreference;
import com.mangareader.domain.user.valueobject.VisibilitySetting;

@DisplayName("UserProfileSettings")
class UserProfileSettingsTest {
    private User buildUser() {
        return User.builder()
                .name("User Test")
                .email("user@test.com")
                .passwordHash("hash")
                .build();
    }

    @Test
    @DisplayName("Deve iniciar defaults com visibilidade pública e conteúdo adulto desfocado")
    void shouldInitializeDefaultProfileSettings() {
        User user = buildUser();

        UserProfileSettings settings = UserProfileSettings.defaults(user);

        assertThat(settings.getUser()).isEqualTo(user);
        assertThat(settings.getCommentVisibility()).isEqualTo(VisibilitySetting.PUBLIC);
        assertThat(settings.getViewHistoryVisibility()).isEqualTo(VisibilitySetting.PUBLIC);
        assertThat(settings.getAdultContentPreference()).isEqualTo(AdultContentPreference.BLUR);
    }

    @Test
    @DisplayName("Deve permitir sobrescrever visibilidade no builder")
    void shouldOverrideVisibilitySettings() {
        User user = buildUser();

        UserProfileSettings settings = UserProfileSettings.builder()
                .user(user)
                .commentVisibility(VisibilitySetting.PRIVATE)
                .viewHistoryVisibility(VisibilitySetting.DO_NOT_TRACK)
                .adultContentPreference(AdultContentPreference.HIDE)
                .build();

        assertThat(settings.getCommentVisibility()).isEqualTo(VisibilitySetting.PRIVATE);
        assertThat(settings.getViewHistoryVisibility()).isEqualTo(VisibilitySetting.DO_NOT_TRACK);
        assertThat(settings.getAdultContentPreference()).isEqualTo(AdultContentPreference.HIDE);
    }
}
