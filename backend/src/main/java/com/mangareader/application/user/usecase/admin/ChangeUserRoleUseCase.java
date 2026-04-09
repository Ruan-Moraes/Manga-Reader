package com.mangareader.application.user.usecase.admin;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Altera o role de um usuário. Admin não pode alterar o próprio role.
 */
@Service
@RequiredArgsConstructor
public class ChangeUserRoleUseCase {

    private final UserRepositoryPort userRepository;

    @Transactional
    public User execute(UUID adminId, UUID targetUserId, UserRole newRole) {
        if (adminId.equals(targetUserId)) {
            throw new IllegalArgumentException("Admin não pode alterar o próprio role");
        }

        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));

        user.setRole(newRole);

        return userRepository.save(user);
    }
}
