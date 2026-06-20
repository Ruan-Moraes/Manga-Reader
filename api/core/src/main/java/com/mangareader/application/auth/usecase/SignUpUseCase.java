package com.mangareader.application.auth.usecase;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.user.port.UserProfileSettingsRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.port.UserSystemSettingsRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserProfileSettings;
import com.mangareader.domain.user.entity.UserSystemSettings;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.shared.exception.DuplicateResourceException;

import lombok.RequiredArgsConstructor;

/**
 * Caso de uso: Cadastro de novo usuário (Sign Up).
 * <p>
 * Cria o usuário no banco e retorna tokens JWT.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class SignUpUseCase {
    private final UserRepositoryPort userRepository;
    private final UserProfileSettingsRepositoryPort profileSettingsRepository;
    private final UserSystemSettingsRepositoryPort systemSettingsRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenPort tokenPort;

    public record SignUpInput(String name, String email, String password) {}

    public record SignUpOutput(
            String accessToken,
            String refreshToken,
            String userId,
            String name,
            String email,
            String role
    ) {}

    public SignUpOutput execute(SignUpInput input) {
        if (userRepository.existsByEmail(input.email())) {
            throw new DuplicateResourceException("User", "email", input.email());
        }

        User user = User.builder()
                .name(input.name())
                .email(input.email())
                .passwordHash(passwordEncoder.encode(input.password()))
                .role(UserRole.MEMBER)
                .build();

        user = userRepository.save(user);
        profileSettingsRepository.save(UserProfileSettings.defaults(user));
        systemSettingsRepository.save(UserSystemSettings.defaults(user));

        String accessToken = tokenPort.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name()
        );

        String refreshToken = tokenPort.generateRefreshToken(user.getId());

        return new SignUpOutput(
                accessToken,
                refreshToken,
                user.getId().toString(),
                user.getName(),
                user.getEmail(),
                user.getRole().name()
        );
    }
}
