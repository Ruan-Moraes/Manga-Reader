package com.mangareader.application.user.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.user.port.UserProfileSettingsRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.service.UserProfileSettingsResolver;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserProfileSettings;
import com.mangareader.domain.user.valueobject.AdultContentPreference;
import com.mangareader.domain.user.valueobject.VisibilitySetting;
import com.mangareader.shared.exception.ResourceNotFoundException;
import com.mangareader.application.analytics.usecase.ClearBehaviorHistoryUseCase;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza configurações de privacidade do perfil.
 * <p>
 * Ao entrar ou sair de DO_NOT_TRACK, limpa todas as projeções do histórico
 * unificado antes de tornar a nova visibilidade efetiva.
 */
@Service
@RequiredArgsConstructor
public class UpdatePrivacySettingsUseCase {
    private final UserRepositoryPort userRepository;
    private final UserProfileSettingsRepositoryPort profileSettingsRepository;
    private final UserProfileSettingsResolver profileSettingsResolver;
    private final ClearTrackedHistoryUseCase clearTrackedHistoryUseCase;
    private final ClearBehaviorHistoryUseCase clearBehaviorHistoryUseCase;

    public record PrivacyInput(
            UUID userId,
            VisibilitySetting commentVisibility,
            VisibilitySetting viewHistoryVisibility,
            VisibilitySetting libraryVisibility,
            AdultContentPreference adultContentPreference,
            Boolean behaviorAnalyticsEnabled
    ) {
        public PrivacyInput(UUID userId, VisibilitySetting commentVisibility,
                VisibilitySetting viewHistoryVisibility, VisibilitySetting libraryVisibility,
                AdultContentPreference adultContentPreference) {
            this(userId, commentVisibility, viewHistoryVisibility, libraryVisibility,
                    adultContentPreference, null);
        }
    }

    @Transactional
    public UserProfileSettings execute(PrivacyInput input) {
        if (input.viewHistoryVisibility() == VisibilitySetting.DO_NOT_TRACK
                && Boolean.TRUE.equals(input.behaviorAnalyticsEnabled())) {
            throw new IllegalArgumentException("Behavior analytics cannot be enabled under DO_NOT_TRACK");
        }
        User user = userRepository.findById(input.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", input.userId()));
        UserProfileSettings settings = profileSettingsResolver.getOrCreate(user);

        if (input.commentVisibility() != null) {
            settings.setCommentVisibility(input.commentVisibility());
        }

        if (input.viewHistoryVisibility() != null) {
            VisibilitySetting previousVisibility = settings.getViewHistoryVisibility();

            if (previousVisibility == VisibilitySetting.DO_NOT_TRACK
                    || input.viewHistoryVisibility() == VisibilitySetting.DO_NOT_TRACK) {
                clearTrackedHistoryUseCase.execute(input.userId().toString());
            }

            settings.setViewHistoryVisibility(input.viewHistoryVisibility());
            if (input.viewHistoryVisibility() == VisibilitySetting.DO_NOT_TRACK) {
                settings.setBehaviorAnalyticsEnabled(false);
            }
        }

        if (input.libraryVisibility() != null) {
            settings.setLibraryVisibility(input.libraryVisibility());
        }

        if (input.adultContentPreference() != null) {
            settings.setAdultContentPreference(input.adultContentPreference());
        }

        if (input.behaviorAnalyticsEnabled() != null) {
            boolean enabled = input.behaviorAnalyticsEnabled();
            if (settings.getViewHistoryVisibility() == VisibilitySetting.DO_NOT_TRACK && enabled) {
                throw new IllegalArgumentException("Behavior analytics cannot be enabled under DO_NOT_TRACK");
            }
            if (!enabled && settings.isBehaviorAnalyticsEnabled()) {
                clearBehaviorHistoryUseCase.execute(input.userId().toString());
            }
            settings.setBehaviorAnalyticsEnabled(enabled);
        }

        return profileSettingsRepository.save(settings);
    }
}
