package com.mangareader.application.user.usecase.admin;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Bane um usuário com motivo e duração opcional. Não pode banir ADMIN.
 */
@Service
@RequiredArgsConstructor
public class BanUserUseCase {

    private final UserRepositoryPort userRepository;

    @Transactional
    public User execute(UUID targetUserId, String reason, LocalDateTime bannedUntil) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));

        if (user.getRole() == UserRole.ADMIN) {
            throw new IllegalArgumentException("Não é possível banir um administrador");
        }

        if (user.isBanned()) {
            throw new IllegalStateException("Usuário já está banido");
        }

        user.setBanned(true);
        user.setBannedAt(LocalDateTime.now());
        user.setBannedReason(reason);
        user.setBannedUntil(bannedUntil);

        return userRepository.save(user);
    }
}
