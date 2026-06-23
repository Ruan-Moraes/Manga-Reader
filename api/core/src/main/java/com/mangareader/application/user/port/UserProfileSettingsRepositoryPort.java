package com.mangareader.application.user.port;

import java.util.Optional;
import java.util.UUID;

import com.mangareader.domain.user.entity.UserProfileSettings;

/**
 * Port de saída para configurações de perfil do usuário.
 */
public interface UserProfileSettingsRepositoryPort {
    Optional<UserProfileSettings> findByUserId(UUID userId);

    UserProfileSettings save(UserProfileSettings settings);
}
