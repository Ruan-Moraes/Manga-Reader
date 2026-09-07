package com.toonlira.application.user.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.user.port.UserRepositoryPort;
import com.toonlira.application.user.port.UserSystemSettingsRepositoryPort;
import com.toonlira.application.user.service.UserSystemSettingsResolver;
import com.toonlira.domain.user.entity.User;
import com.toonlira.domain.user.entity.UserSystemSettings;
import com.toonlira.domain.user.valueobject.UserSettings;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UpdateUserSettingsUseCase {
    private final UserRepositoryPort userRepository;
    private final UserSystemSettingsResolver systemSettingsResolver;
    private final UserSystemSettingsRepositoryPort systemSettingsRepository;

    @Transactional
    public UserSettings execute(UUID userId, UserSettings settings) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (settings == null) {
            throw new IllegalArgumentException("settings must not be null");
        }

        UserSystemSettings systemSettings = systemSettingsResolver.getOrCreate(user);
        systemSettings.updateSettings(settings);

        return systemSettingsRepository.save(systemSettings).toSettings();
    }
}
