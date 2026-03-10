package com.mangareader.application.auth.usecase;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("ResetPasswordUseCase")
class ResetPasswordUseCaseTest {

    @Mock
    private TokenPort tokenPort;

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private ResetPasswordUseCase resetPasswordUseCase;

    private final UUID USER_ID = UUID.randomUUID();
    private final String VALID_TOKEN = "valid.reset.token";
    private final String NEW_PASSWORD = "novaSenha123";
    private final String ENCODED_NEW_PASSWORD = "encoded_novaSenha123";

    private User buildUser() {
        return User.builder()
                .id(USER_ID)
                .name("Ruan Silva")
                .email("ruan@email.com")
                .passwordHash("old_hash")
                .role(UserRole.MEMBER)
                .build();
    }

    @Nested
    @DisplayName("Cenário de sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve redefinir senha quando token é válido e do tipo password_reset")
        void deveRedefinirSenhaComTokenValido() {
            // Arrange
            User user = buildUser();

            when(tokenPort.isTokenValid(VALID_TOKEN)).thenReturn(true);
            when(tokenPort.extractType(VALID_TOKEN)).thenReturn("password_reset");
            when(tokenPort.extractUserId(VALID_TOKEN)).thenReturn(USER_ID);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(passwordEncoder.encode(NEW_PASSWORD)).thenReturn(ENCODED_NEW_PASSWORD);

            // Act
            resetPasswordUseCase.execute(VALID_TOKEN, NEW_PASSWORD);

            // Assert
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());

            assertThat(userCaptor.getValue().getPasswordHash()).isEqualTo(ENCODED_NEW_PASSWORD);
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar BusinessRuleException quando token é inválido ou expirado")
        void deveLancarExcecaoQuandoTokenInvalido() {
            // Arrange
            when(tokenPort.isTokenValid("token.expirado")).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> resetPasswordUseCase.execute("token.expirado", NEW_PASSWORD))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessage("Token de redefinição inválido ou expirado")
                    .extracting("statusCode")
                    .isEqualTo(400);

            verify(tokenPort, never()).extractType(any());
            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Deve lançar BusinessRuleException quando token não é do tipo password_reset")
        void deveLancarExcecaoQuandoTokenTipoErrado() {
            // Arrange
            when(tokenPort.isTokenValid(VALID_TOKEN)).thenReturn(true);
            when(tokenPort.extractType(VALID_TOKEN)).thenReturn("refresh");

            // Act & Assert
            assertThatThrownBy(() -> resetPasswordUseCase.execute(VALID_TOKEN, NEW_PASSWORD))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessage("Token não é do tipo password_reset")
                    .extracting("statusCode")
                    .isEqualTo(400);

            verify(userRepository, never()).findById(any());
            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando usuário do token não existe")
        void deveLancarExcecaoQuandoUsuarioNaoExiste() {
            // Arrange
            UUID missingId = UUID.randomUUID();

            when(tokenPort.isTokenValid(VALID_TOKEN)).thenReturn(true);
            when(tokenPort.extractType(VALID_TOKEN)).thenReturn("password_reset");
            when(tokenPort.extractUserId(VALID_TOKEN)).thenReturn(missingId);
            when(userRepository.findById(missingId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> resetPasswordUseCase.execute(VALID_TOKEN, NEW_PASSWORD))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");

            verify(passwordEncoder, never()).encode(any());
            verify(userRepository, never()).save(any());
        }
    }
}
