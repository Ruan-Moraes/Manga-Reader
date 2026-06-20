package com.mangareader.application.user.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.service.UserSystemSettingsResolver;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.UserSettings;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GetUserSettingsUseCase {
    private final UserRepositoryPort userRepository;
    private final UserSystemSettingsResolver systemSettingsResolver;

    @Transactional
    public UserSettings execute(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        return systemSettingsResolver.getOrCreate(user).toSettings();
    }
}
