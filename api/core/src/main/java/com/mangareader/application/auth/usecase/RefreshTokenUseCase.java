package com.mangareader.application.auth.usecase;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.auth.port.RefreshTokenRepositoryPort;
import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.auth.entity.RefreshToken;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.dto.ApiErrorCode;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Caso de uso: Renovação de tokens via refresh token, com rotação.
 * <p>
 * Cada uso revoga o token apresentado e emite um par novo na mesma família.
 * Um token já revogado sendo reapresentado indica reuso (possível roubo):
 * a família inteira é revogada, encerrando a sessão em todos os portadores.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class RefreshTokenUseCase {
    private final TokenPort tokenPort;
    private final UserRepositoryPort userRepository;
    private final RefreshTokenRepositoryPort refreshTokenRepository;

    public record RefreshInput(String refreshToken) {}

    public record RefreshOutput(String accessToken, String refreshToken) {}

    public RefreshOutput execute(RefreshInput input) {
        String token = input.refreshToken();

        // Assinatura/expiração do JWT e claim type — um access token válido
        // não pode ser usado como refresh.
        if (!tokenPort.isTokenValid(token) || !"refresh".equals(tokenPort.extractType(token))) {
            throw unauthorized();
        }

        RefreshToken stored = refreshTokenRepository.findByToken(token)
                .orElseThrow(RefreshTokenUseCase::unauthorized);

        if (stored.isRevoked()) {
            // Reuso de token rotacionado: derruba a sessão inteira.
            refreshTokenRepository.revokeFamily(stored.getFamilyId());

            throw unauthorized();
        }

        if (stored.isExpired(LocalDateTime.now())) {
            throw unauthorized();
        }

        UUID userId = tokenPort.extractUserId(token);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        refreshTokenRepository.revoke(stored);

        String newAccessToken = tokenPort.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name()
        );

        String newRefreshToken = tokenPort.generateRefreshToken(user.getId());

        refreshTokenRepository.store(
                newRefreshToken, user.getId(), stored.getFamilyId(),
                tokenPort.extractExpiration(newRefreshToken)
        );

        return new RefreshOutput(newAccessToken, newRefreshToken);
    }

    private static BusinessRuleException unauthorized() {
        return new BusinessRuleException(
                "Refresh token inválido ou expirado.", 401, ApiErrorCode.AUTH_REFRESH_TOKEN_EXPIRED
        );
    }
}
