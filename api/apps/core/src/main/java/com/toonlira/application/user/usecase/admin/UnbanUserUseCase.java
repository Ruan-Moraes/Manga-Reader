package com.toonlira.application.user.usecase.admin;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.user.port.UserRepositoryPort;
import com.toonlira.domain.user.entity.User;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Remove o ban de um usuário, limpando todos os campos relacionados.
 */
@Service
@RequiredArgsConstructor
public class UnbanUserUseCase {
    private final UserRepositoryPort userRepository;

    @Transactional
    public User execute(UUID targetUserId) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));

        if (!user.isBanned()) {
            throw new IllegalStateException("Usuário não está banido");
        }

        user.setBanned(false);
        user.setBannedAt(null);
        user.setBannedReason(null);
        user.setBannedUntil(null);

        return userRepository.save(user);
    }
}
