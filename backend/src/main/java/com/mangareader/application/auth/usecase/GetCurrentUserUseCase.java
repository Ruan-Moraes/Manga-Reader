package com.mangareader.application.auth.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Retorna os dados do usuário autenticado (GET /auth/me).
 */
@Service
@RequiredArgsConstructor
public class GetCurrentUserUseCase {

    private final UserRepositoryPort userRepository;

    public User execute(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId.toString()));
    }
}
