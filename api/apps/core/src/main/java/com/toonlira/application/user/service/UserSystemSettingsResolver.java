package com.toonlira.application.user.service;

import org.springframework.stereotype.Service;

import com.toonlira.application.user.port.UserSystemSettingsRepositoryPort;
import com.toonlira.domain.user.entity.User;
import com.toonlira.domain.user.entity.UserSystemSettings;

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
