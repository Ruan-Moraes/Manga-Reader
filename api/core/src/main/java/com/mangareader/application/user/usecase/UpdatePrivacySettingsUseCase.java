package com.mangareader.application.user.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.user.port.UserProfileSettingsRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.port.ViewHistoryRepositoryPort;
import com.mangareader.application.user.service.UserProfileSettingsResolver;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserProfileSettings;
import com.mangareader.domain.user.valueobject.AdultContentPreference;
import com.mangareader.domain.user.valueobject.VisibilitySetting;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza configurações de privacidade do perfil.
 * <p>
 * Quando viewHistoryVisibility muda para DO_NOT_TRACK, deleta todo o histórico.
 */
@Service
@RequiredArgsConstructor
public class UpdatePrivacySettingsUseCase {
    private final UserRepositoryPort userRepository;
    private final UserProfileSettingsRepositoryPort profileSettingsRepository;
    private final UserProfileSettingsResolver profileSettingsResolver;
    private final ViewHistoryRepositoryPort viewHistoryRepository;

    public record PrivacyInput(
            UUID userId,
            VisibilitySetting commentVisibility,
            VisibilitySetting viewHistoryVisibility,
            AdultContentPreference adultContentPreference
    ) {}

    @Transactional
    public UserProfileSettings execute(PrivacyInput input) {
        User user = userRepository.findById(input.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", input.userId()));
        UserProfileSettings settings = profileSettingsResolver.getOrCreate(user);

        if (input.commentVisibility() != null) {
            settings.setCommentVisibility(input.commentVisibility());
        }

        if (input.viewHistoryVisibility() != null) {
            settings.setViewHistoryVisibility(input.viewHistoryVisibility());

            if (input.viewHistoryVisibility() == VisibilitySetting.DO_NOT_TRACK) {
                viewHistoryRepository.deleteAllByUserId(input.userId().toString());
            }
        }

        if (input.adultContentPreference() != null) {
            settings.setAdultContentPreference(input.adultContentPreference());
        }

        return profileSettingsRepository.save(settings);
    }
}
