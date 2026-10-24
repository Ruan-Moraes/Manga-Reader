package com.toonlira.infrastructure.persistence.postgres.adapter;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.toonlira.application.user.port.UserProfileSettingsRepositoryPort;
import com.toonlira.domain.user.entity.UserProfileSettings;
import com.toonlira.infrastructure.persistence.postgres.repository.UserProfileSettingsJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port de configurações de perfil ao Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
public class UserProfileSettingsRepositoryAdapter implements UserProfileSettingsRepositoryPort {
    private final UserProfileSettingsJpaRepository jpaRepository;

    @Override
    public Optional<UserProfileSettings> findByUserId(UUID userId) {
        return jpaRepository.findById(userId);
    }

    @Override
    public UserProfileSettings save(UserProfileSettings settings) {
        return jpaRepository.save(settings);
    }
}
