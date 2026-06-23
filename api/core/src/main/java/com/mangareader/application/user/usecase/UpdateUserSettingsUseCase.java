package com.mangareader.application.user.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.port.UserSystemSettingsRepositoryPort;
import com.mangareader.application.user.service.UserSystemSettingsResolver;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserSystemSettings;
import com.mangareader.domain.user.valueobject.UserSettings;
import com.mangareader.shared.exception.ResourceNotFoundException;

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
