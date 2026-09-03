package com.mangareader.application.manga.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.service.UserProfileSettingsResolver;
import com.mangareader.domain.user.valueobject.AdultContentPreference;

import lombok.RequiredArgsConstructor;

/** Resolve a política efetiva sem acoplar casos de uso ao Spring Security. */
@Service
@RequiredArgsConstructor
public class AdultContentAccessPolicy {
    private final UserRepositoryPort userRepository;
    private final UserProfileSettingsResolver settingsResolver;

    @Transactional(readOnly = true)
    public boolean mustExcludeAdult(UUID userId) {
        if (userId == null) return false; // visitante usa BLUR no cliente
        return userRepository.findById(userId)
                .map(settingsResolver::getOrDefault)
                .map(settings -> settings.getAdultContentPreference() == AdultContentPreference.HIDE)
                .orElse(false);
    }
}
