package com.toonlira.application.analytics.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.user.port.UserRepositoryPort;
import com.toonlira.application.user.service.UserProfileSettingsResolver;
import com.toonlira.domain.user.valueobject.VisibilitySetting;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CanCollectBehaviorAnalyticsUseCase {
    private final UserRepositoryPort userRepository;
    private final UserProfileSettingsResolver settingsResolver;

    @Transactional(readOnly = true)
    public boolean execute(UUID userId) {
        var user = userRepository.findById(userId).orElse(null);

        if (user == null || user.isDeactivated()) {
            return false;
        }

        var settings = settingsResolver.getOrDefault(user);

        return settings.isBehaviorAnalyticsEnabled()
                && settings.getViewHistoryVisibility() != VisibilitySetting.DO_NOT_TRACK;
    }
}
