package com.mangareader.application.user.service;

import org.springframework.stereotype.Service;

import com.mangareader.application.user.port.UserProfileSettingsRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserProfileSettings;

import lombok.RequiredArgsConstructor;

/**
 * Resolve configurações de perfil preservando defaults para usuários legados.
 */
@Service
@RequiredArgsConstructor
public class UserProfileSettingsResolver {
    private final UserProfileSettingsRepositoryPort settingsRepository;

    public UserProfileSettings getOrDefault(User user) {
        return settingsRepository.findByUserId(user.getId())
                .orElseGet(() -> UserProfileSettings.defaults(user));
    }

    public UserProfileSettings getOrCreate(User user) {
        return settingsRepository.findByUserId(user.getId())
                .orElseGet(() -> settingsRepository.save(UserProfileSettings.defaults(user)));
    }
}
