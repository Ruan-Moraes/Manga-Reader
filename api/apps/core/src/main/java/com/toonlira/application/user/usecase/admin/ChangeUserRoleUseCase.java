package com.toonlira.application.user.usecase.admin;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.user.port.UserRepositoryPort;
import com.toonlira.domain.user.entity.User;
import com.toonlira.domain.user.valueobject.UserRole;
import com.toonlira.shared.exception.ResourceNotFoundException;

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
