package com.mangareader.application.auth.usecase;

import static org.assertj.core.api.Assertions.assertThat;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.auth.usecase.RefreshTokenUseCase.RefreshInput;
import com.mangareader.application.auth.usecase.RefreshTokenUseCase.RefreshOutput;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("RefreshTokenUseCase")
class RefreshTokenUseCaseTest {
    @Mock
    private TokenPort tokenPort;

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private RefreshTokenUseCase refreshTokenUseCase;

    private final UUID USER_ID = UUID.randomUUID();
    private final String OLD_REFRESH = "old.refresh.token";
    private final String NEW_ACCESS = "new.access.token";
    private final String NEW_REFRESH = "new.refresh.token";

    private User buildUser() {
        return User.builder()
                .id(USER_ID)
                .name("Ruan Silva")
                .email("ruan@email.com")
                .passwordHash("hash")
                .role(UserRole.MEMBER)
                .build();
    }

    @Nested
    @DisplayName("Cenário de sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve renovar tokens quando refresh token é válido")
        void deveRenovarTokensQuandoRefreshTokenValido() {
            // Arrange
            RefreshInput input = new RefreshInput(OLD_REFRESH);
            User user = buildUser();

            when(tokenPort.isTokenValid(OLD_REFRESH)).thenReturn(true);
            when(tokenPort.extractUserId(OLD_REFRESH)).thenReturn(USER_ID);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(tokenPort.generateAccessToken(USER_ID, "ruan@email.com", "MEMBER")).thenReturn(NEW_ACCESS);
            when(tokenPort.generateRefreshToken(USER_ID)).thenReturn(NEW_REFRESH);

            // Act
            RefreshOutput output = refreshTokenUseCase.execute(input);

            // Assert
            assertThat(output.accessToken()).isEqualTo(NEW_ACCESS);
            assertThat(output.refreshToken()).isEqualTo(NEW_REFRESH);
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar BusinessRuleException quando refresh token é inválido")
        void deveLancarExcecaoQuandoTokenInvalido() {
            // Arrange
            RefreshInput input = new RefreshInput("token.invalido");
            when(tokenPort.isTokenValid("token.invalido")).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> refreshTokenUseCase.execute(input))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessage("Refresh token inválido ou expirado.")
                    .extracting("statusCode")
                    .isEqualTo(401);

            verify(tokenPort, never()).extractUserId(any());
            verify(userRepository, never()).findById(any());
        }

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando usuário não existe")
        void deveLancarExcecaoQuandoUsuarioNaoExiste() {
            // Arrange
            UUID missingId = UUID.randomUUID();
            RefreshInput input = new RefreshInput(OLD_REFRESH);

            when(tokenPort.isTokenValid(OLD_REFRESH)).thenReturn(true);
            when(tokenPort.extractUserId(OLD_REFRESH)).thenReturn(missingId);
            when(userRepository.findById(missingId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> refreshTokenUseCase.execute(input))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");

            verify(tokenPort, never()).generateAccessToken(any(), any(), any());
        }
    }
}
