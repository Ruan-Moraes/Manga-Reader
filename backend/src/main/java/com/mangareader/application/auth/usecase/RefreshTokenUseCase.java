package com.mangareader.application.auth.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Caso de uso: Renovação de tokens via refresh token.
 * <p>
 * Valida o refresh token e gera novos access + refresh tokens.
 */
@Service
@RequiredArgsConstructor
public class RefreshTokenUseCase {

    private final TokenPort tokenPort;
    private final UserRepositoryPort userRepository;

    public record RefreshInput(String refreshToken) {}

    public record RefreshOutput(String accessToken, String refreshToken) {}

    public RefreshOutput execute(RefreshInput input) {
        if (!tokenPort.isTokenValid(input.refreshToken())) {
            throw new BusinessRuleException("Refresh token inválido ou expirado.", 401);
        }

        UUID userId = tokenPort.extractUserId(input.refreshToken());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        String newAccessToken = tokenPort.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name()
        );
        String newRefreshToken = tokenPort.generateRefreshToken(user.getId());

        return new RefreshOutput(newAccessToken, newRefreshToken);
    }
}
