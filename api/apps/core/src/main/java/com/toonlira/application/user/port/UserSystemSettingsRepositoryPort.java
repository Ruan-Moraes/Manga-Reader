package com.toonlira.application.user.port;

import java.util.Optional;
import java.util.UUID;

import com.toonlira.domain.user.entity.UserSystemSettings;

/**
 * Port de saída — configurações globais do sistema do usuário (PostgreSQL).
 */
public interface UserSystemSettingsRepositoryPort {
    Optional<UserSystemSettings> findByUserId(UUID userId);

    UserSystemSettings save(UserSystemSettings settings);
}
