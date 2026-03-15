package com.mangareader.application.user.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.port.ViewHistoryRepositoryPort;
import com.mangareader.domain.user.entity.User;
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
    private final ViewHistoryRepositoryPort viewHistoryRepository;

    public record PrivacyInput(
            UUID userId,
            VisibilitySetting commentVisibility,
            VisibilitySetting viewHistoryVisibility
    ) {}

    @Transactional
    public User execute(PrivacyInput input) {
        User user = userRepository.findById(input.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", input.userId()));

        if (input.commentVisibility() != null) {
            user.setCommentVisibility(input.commentVisibility());
        }

        if (input.viewHistoryVisibility() != null) {
            user.setViewHistoryVisibility(input.viewHistoryVisibility());

            if (input.viewHistoryVisibility() == VisibilitySetting.DO_NOT_TRACK) {
                viewHistoryRepository.deleteAllByUserId(input.userId().toString());
            }
        }

        return userRepository.save(user);
    }
}
