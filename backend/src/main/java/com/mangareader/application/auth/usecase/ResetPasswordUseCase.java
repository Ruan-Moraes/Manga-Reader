package com.mangareader.application.auth.usecase;

import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Processa a redefinição de senha usando um token de reset.
 * <p>
 * Valida o token JWT (tipo=password_reset), extrai o userId
 * e atualiza o hash da nova senha.
 */
@Service
@RequiredArgsConstructor
public class ResetPasswordUseCase {

    private final TokenPort tokenPort;
    private final UserRepositoryPort userRepository;
    private final PasswordEncoder passwordEncoder;

    public void execute(String token, String newPassword) {
        if (!tokenPort.isTokenValid(token)) {
            throw new BusinessRuleException("Token de redefinição inválido ou expirado", 400);
        }

        String type = tokenPort.extractType(token);
        if (!"password_reset".equals(type)) {
            throw new BusinessRuleException("Token não é do tipo password_reset", 400);
        }

        UUID userId = tokenPort.extractUserId(token);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
