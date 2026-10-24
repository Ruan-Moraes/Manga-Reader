package com.toonlira.application.user.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.user.port.UserRepositoryPort;
import com.toonlira.domain.user.entity.User;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Retorna o perfil público de um usuário por ID.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GetUserProfileUseCase {
    private final UserRepositoryPort userRepository;

    public User execute(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }
}
