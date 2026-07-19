package com.mangareader.application.analytics.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.service.UserProfileSettingsResolver;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserProfileSettings;
import com.mangareader.domain.user.valueobject.VisibilitySetting;

@ExtendWith(MockitoExtension.class)
class CanCollectBehaviorAnalyticsUseCaseTest {
    @Mock
    private UserRepositoryPort userRepository;
    @Mock
    private UserProfileSettingsResolver settingsResolver;

    private CanCollectBehaviorAnalyticsUseCase useCase;
    private UUID userId;
    private User user;
    private UserProfileSettings settings;

    @BeforeEach
    void setUp() {
        useCase = new CanCollectBehaviorAnalyticsUseCase(userRepository, settingsResolver);
        userId = UUID.randomUUID();
        user = User.builder().id(userId).name("User").email("user@example.com").passwordHash("hash").build();
        settings = UserProfileSettings.defaults(user);
    }

    @Test
    void allowsCollectionOnlyWithActiveConsent() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(settingsResolver.getOrDefault(user)).thenReturn(settings);

        assertThat(useCase.execute(userId)).isTrue();
    }

    @Test
    void blocksDoNotTrack() {
        settings.setViewHistoryVisibility(VisibilitySetting.DO_NOT_TRACK);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(settingsResolver.getOrDefault(user)).thenReturn(settings);

        assertThat(useCase.execute(userId)).isFalse();
    }

    @Test
    void treatsDeletedAccountAsDisabled() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThat(useCase.execute(userId)).isFalse();
    }
}
