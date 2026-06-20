package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.mangareader.application.user.port.UserSystemSettingsRepositoryPort;
import com.mangareader.domain.user.entity.UserSystemSettings;
import com.mangareader.infrastructure.persistence.postgres.repository.UserSystemSettingsJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port de configurações de sistema ao Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
public class UserSystemSettingsRepositoryAdapter implements UserSystemSettingsRepositoryPort {
    private final UserSystemSettingsJpaRepository jpaRepository;

    @Override
    public Optional<UserSystemSettings> findByUserId(UUID userId) {
        return jpaRepository.findById(userId);
    }

    @Override
    public UserSystemSettings save(UserSystemSettings settings) {
        return jpaRepository.save(settings);
    }
}
