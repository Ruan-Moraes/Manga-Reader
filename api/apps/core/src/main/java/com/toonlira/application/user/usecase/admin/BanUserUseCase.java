package com.toonlira.application.user.usecase.admin;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.user.port.UserRepositoryPort;
import com.toonlira.domain.user.entity.User;
import com.toonlira.domain.user.valueobject.UserRole;
import com.toonlira.shared.exception.ResourceNotFoundException;

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
