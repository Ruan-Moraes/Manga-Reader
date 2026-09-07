package com.toonlira.application.user.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.user.port.UserRepositoryPort;
import com.toonlira.application.user.service.UserSystemSettingsResolver;
import com.toonlira.domain.user.entity.User;
import com.toonlira.domain.user.valueobject.UserSettings;
import com.toonlira.shared.exception.ResourceNotFoundException;

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
