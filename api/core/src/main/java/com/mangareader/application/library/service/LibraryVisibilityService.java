package com.mangareader.application.library.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.service.UserProfileSettingsResolver;
import com.mangareader.domain.user.valueobject.VisibilitySetting;

import lombok.RequiredArgsConstructor;

/**
 * DT-49: decide se um viewer pode ver a biblioteca de um usuário, no mesmo
 * padrão do enriched profile (dono sempre vê; terceiros/anônimos só quando
 * libraryVisibility == PUBLIC).
 */
@Service
@RequiredArgsConstructor
public class LibraryVisibilityService {
    private final UserRepositoryPort userRepository;
    private final UserProfileSettingsResolver profileSettingsResolver;

    public boolean canView(UUID ownerId, UUID viewerUserId) {
        if (ownerId.equals(viewerUserId)) {
            return true;
        }

        return userRepository.findById(ownerId)
                .map(owner -> profileSettingsResolver.getOrDefault(owner).getLibraryVisibility() == VisibilitySetting.PUBLIC)
                .orElse(false);
    }
}
