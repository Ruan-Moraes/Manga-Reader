package com.toonlira.application.auth.usecase;

import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.auth.port.RefreshTokenRepositoryPort;
import com.toonlira.application.auth.port.TokenPort;
import com.toonlira.application.user.port.UserRepositoryPort;
import com.toonlira.domain.user.entity.User;
import com.toonlira.shared.dto.ApiErrorCode;
import com.toonlira.shared.exception.BusinessRuleException;

import lombok.RequiredArgsConstructor;

/**
 * Caso de uso: Autenticação (Sign In).
 * <p>
 * Valida credenciais e retorna tokens JWT (access + refresh). O refresh é
 * persistido (hash) em uma família nova — cada login abre uma sessão/cadeia
 * de rotação própria.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class SignInUseCase {
    private final UserRepositoryPort userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenPort tokenPort;
    private final RefreshTokenRepositoryPort refreshTokenRepository;

    public record SignInInput(String email, String password) {}

    public record SignInOutput(
            String accessToken,
            String refreshToken,
            String userId,
            String name,
            String email,
            String role,
            String photoUrl
    ) {}

    public SignInOutput execute(SignInInput input) {
        User user = userRepository.findByEmail(input.email())
                .orElseThrow(() -> new BusinessRuleException(
                        "E-mail ou senha incorretos.", 401
                ));

        if (!passwordEncoder.matches(input.password(), user.getPasswordHash())) {
            throw new BusinessRuleException("E-mail ou senha incorretos.", 401);
        }

        if (user.isBanned() || user.isDeactivated()) {
            throw new BusinessRuleException(
                    "Conta indisponível.", 403, ApiErrorCode.AUTH_ACCESS_DENIED
            );
        }

        String accessToken = tokenPort.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name()
        );

        String refreshToken = tokenPort.generateRefreshToken(user.getId());

        refreshTokenRepository.store(
                refreshToken, user.getId(), UUID.randomUUID(),
                tokenPort.extractExpiration(refreshToken)
        );

        return new SignInOutput(
                accessToken,
                refreshToken,
                user.getId().toString(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.getPhotoUrl()
        );
    }
}
