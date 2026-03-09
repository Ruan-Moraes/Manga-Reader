package com.mangareader.application.user.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Retorna o perfil público de um usuário por ID.
 */
@Service
@RequiredArgsConstructor
public class GetUserProfileUseCase {

    private final UserRepositoryPort userRepository;

    public User execute(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }
}
