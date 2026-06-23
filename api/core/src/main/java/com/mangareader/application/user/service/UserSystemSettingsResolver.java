package com.mangareader.application.user.service;

import org.springframework.stereotype.Service;

import com.mangareader.application.user.port.UserSystemSettingsRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserSystemSettings;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserSystemSettingsResolver {
    private final UserSystemSettingsRepositoryPort settingsRepository;

    public UserSystemSettings getOrDefault(User user) {
        return settingsRepository.findByUserId(user.getId())
                .orElseGet(() -> UserSystemSettings.defaults(user));
    }

    public UserSystemSettings getOrCreate(User user) {
        return settingsRepository.findByUserId(user.getId())
                .orElseGet(() -> settingsRepository.save(UserSystemSettings.defaults(user)));
    }
}
