package com.mangareader.application.auth.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.auth.port.RefreshTokenRepositoryPort;
import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.auth.usecase.RefreshTokenUseCase.RefreshInput;
import com.mangareader.application.auth.usecase.RefreshTokenUseCase.RefreshOutput;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.auth.entity.RefreshToken;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.shared.dto.ApiErrorCode;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("RefreshTokenUseCase")
class RefreshTokenUseCaseTest {
    @Mock
    private TokenPort tokenPort;

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private RefreshTokenRepositoryPort refreshTokenRepository;

    @InjectMocks
    private RefreshTokenUseCase refreshTokenUseCase;

    private final UUID USER_ID = UUID.randomUUID();
    private final UUID FAMILY_ID = UUID.randomUUID();
    private final String OLD_REFRESH = "old.refresh.token";
    private final String NEW_ACCESS = "new.access.token";
    private final String NEW_REFRESH = "new.refresh.token";
    private final LocalDateTime EXPIRES_AT = LocalDateTime.now().plusDays(7);

    private User buildUser() {
        return User.builder()
                .id(USER_ID)
                .name("Ruan Silva")
                .email("ruan@email.com")
                .passwordHash("hash")
                .role(UserRole.MEMBER)
                .build();
    }

    private RefreshToken buildStored(LocalDateTime expiresAt) {
        return RefreshToken.builder()
                .id(UUID.randomUUID())
                .userId(USER_ID)
                .tokenHash("a".repeat(64))
                .familyId(FAMILY_ID)
                .expiresAt(expiresAt)
                .build();
    }

    private void stubValidRefreshJwt() {
        when(tokenPort.isTokenValid(OLD_REFRESH)).thenReturn(true);
        when(tokenPort.extractType(OLD_REFRESH)).thenReturn("refresh");
        when(tokenPort.extractTokenId(OLD_REFRESH)).thenReturn(UUID.randomUUID().toString());
    }

    @Nested
    @DisplayName("Cenário de sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve rotacionar: revoga o token usado e persiste o novo na mesma família")
        void deveRotacionarTokens() {
            // Arrange
            RefreshInput input = new RefreshInput(OLD_REFRESH);
            RefreshToken stored = buildStored(EXPIRES_AT);
            User user = buildUser();

            stubValidRefreshJwt();
            when(refreshTokenRepository.findByToken(OLD_REFRESH)).thenReturn(Optional.of(stored));
            when(refreshTokenRepository.revokeIfActive(stored)).thenReturn(true);
            when(tokenPort.extractUserId(OLD_REFRESH)).thenReturn(USER_ID);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(tokenPort.generateAccessToken(USER_ID, "ruan@email.com", "MEMBER")).thenReturn(NEW_ACCESS);
            when(tokenPort.generateRefreshToken(USER_ID)).thenReturn(NEW_REFRESH);
            when(tokenPort.extractExpiration(NEW_REFRESH)).thenReturn(EXPIRES_AT);

            // Act
            RefreshOutput output = refreshTokenUseCase.execute(input);

            // Assert
            assertThat(output.accessToken()).isEqualTo(NEW_ACCESS);
            assertThat(output.refreshToken()).isEqualTo(NEW_REFRESH);
            verify(refreshTokenRepository).revokeIfActive(stored);
            verify(refreshTokenRepository).store(
                    eq(NEW_REFRESH), eq(USER_ID), eq(FAMILY_ID), eq(EXPIRES_AT)
            );
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve rejeitar refresh token com assinatura inválida")
        void deveRejeitarTokenInvalido() {
            RefreshInput input = new RefreshInput("token.invalido");
            when(tokenPort.isTokenValid("token.invalido")).thenReturn(false);

            assertThatThrownBy(() -> refreshTokenUseCase.execute(input))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessage("Refresh token inválido ou expirado.")
                    .extracting("statusCode", "errorCode")
                    .containsExactly(401, ApiErrorCode.AUTH_REFRESH_TOKEN_EXPIRED);

            verify(refreshTokenRepository, never()).findByToken(any());
            verify(userRepository, never()).findById(any());
        }

        @Test
        @DisplayName("Deve rejeitar access token usado como refresh (type ausente)")
        void deveRejeitarAccessTokenComoRefresh() {
            RefreshInput input = new RefreshInput(OLD_REFRESH);
            when(tokenPort.isTokenValid(OLD_REFRESH)).thenReturn(true);
            when(tokenPort.extractType(OLD_REFRESH)).thenReturn(null);

            assertThatThrownBy(() -> refreshTokenUseCase.execute(input))
                    .isInstanceOf(BusinessRuleException.class)
                    .extracting("statusCode")
                    .isEqualTo(401);

            verify(refreshTokenRepository, never()).findByToken(any());
            verify(tokenPort, never()).generateAccessToken(any(), any(), any());
        }

        @Test
        @DisplayName("Deve rejeitar refresh token sem jti")
        void deveRejeitarRefreshSemJti() {
            when(tokenPort.isTokenValid(OLD_REFRESH)).thenReturn(true);
            when(tokenPort.extractType(OLD_REFRESH)).thenReturn("refresh");
            when(tokenPort.extractTokenId(OLD_REFRESH)).thenReturn(null);

            assertThatThrownBy(() -> refreshTokenUseCase.execute(new RefreshInput(OLD_REFRESH)))
                    .isInstanceOf(BusinessRuleException.class)
                    .extracting("statusCode")
                    .isEqualTo(401);

            verify(refreshTokenRepository, never()).findByToken(any());
        }

        @Test
        @DisplayName("Deve rejeitar refresh token com jti adulterado")
        void deveRejeitarRefreshComJtiInvalido() {
            when(tokenPort.isTokenValid(OLD_REFRESH)).thenReturn(true);
            when(tokenPort.extractType(OLD_REFRESH)).thenReturn("refresh");
            when(tokenPort.extractTokenId(OLD_REFRESH)).thenReturn("jti-nao-uuid");

            assertThatThrownBy(() -> refreshTokenUseCase.execute(new RefreshInput(OLD_REFRESH)))
                    .isInstanceOf(BusinessRuleException.class)
                    .extracting("statusCode")
                    .isEqualTo(401);

            verify(refreshTokenRepository, never()).findByToken(any());
        }

        @Test
        @DisplayName("Deve rejeitar token válido mas desconhecido da tabela")
        void deveRejeitarTokenDesconhecido() {
            RefreshInput input = new RefreshInput(OLD_REFRESH);

            stubValidRefreshJwt();
            when(refreshTokenRepository.findByToken(OLD_REFRESH)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> refreshTokenUseCase.execute(input))
                    .isInstanceOf(BusinessRuleException.class)
                    .extracting("statusCode")
                    .isEqualTo(401);

            verify(tokenPort, never()).generateAccessToken(any(), any(), any());
        }

        @Test
        @DisplayName("Reuso de token revogado deve derrubar a família inteira")
        void reusoDeveRevogarFamilia() {
            RefreshInput input = new RefreshInput(OLD_REFRESH);
            RefreshToken stored = buildStored(EXPIRES_AT);
            stored.revoke(LocalDateTime.now().minusMinutes(5));

            stubValidRefreshJwt();
            when(refreshTokenRepository.findByToken(OLD_REFRESH)).thenReturn(Optional.of(stored));

            assertThatThrownBy(() -> refreshTokenUseCase.execute(input))
                    .isInstanceOf(BusinessRuleException.class)
                    .extracting("statusCode")
                    .isEqualTo(401);

            verify(refreshTokenRepository).revokeFamily(FAMILY_ID);
            verify(tokenPort, never()).generateAccessToken(any(), any(), any());
        }

        @Test
        @DisplayName("Rotação concorrente deve tratar a atualização perdida como reuso e revogar a família")
        void rotacaoConcorrenteDeveRevogarFamilia() {
            RefreshToken stored = buildStored(EXPIRES_AT);

            stubValidRefreshJwt();
            when(refreshTokenRepository.findByToken(OLD_REFRESH)).thenReturn(Optional.of(stored));
            when(tokenPort.extractUserId(OLD_REFRESH)).thenReturn(USER_ID);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
            when(refreshTokenRepository.revokeIfActive(stored)).thenReturn(false);

            assertThatThrownBy(() -> refreshTokenUseCase.execute(new RefreshInput(OLD_REFRESH)))
                    .isInstanceOf(BusinessRuleException.class)
                    .extracting("statusCode", "errorCode")
                    .containsExactly(401, ApiErrorCode.AUTH_REFRESH_TOKEN_EXPIRED);

            verify(refreshTokenRepository).revokeFamily(FAMILY_ID);
            verify(tokenPort, never()).generateAccessToken(any(), any(), any());
            verify(refreshTokenRepository, never()).store(any(), any(), any(), any());
        }

        @Test
        @DisplayName("Conta desativada não deve renovar sessão e deve revogar a família")
        void contaDesativadaDeveRevogarFamilia() {
            RefreshToken stored = buildStored(EXPIRES_AT);
            User user = buildUser();
            user.setDeactivated(true);

            stubValidRefreshJwt();
            when(refreshTokenRepository.findByToken(OLD_REFRESH)).thenReturn(Optional.of(stored));
            when(tokenPort.extractUserId(OLD_REFRESH)).thenReturn(USER_ID);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

            assertThatThrownBy(() -> refreshTokenUseCase.execute(new RefreshInput(OLD_REFRESH)))
                    .isInstanceOf(BusinessRuleException.class)
                    .extracting("statusCode", "errorCode")
                    .containsExactly(401, ApiErrorCode.AUTH_REFRESH_TOKEN_EXPIRED);

            verify(refreshTokenRepository).revokeFamily(FAMILY_ID);
            verify(refreshTokenRepository, never()).revokeIfActive(any());
            verify(tokenPort, never()).generateAccessToken(any(), any(), any());
        }

        @Test
        @DisplayName("Conta banida não deve renovar sessão e deve revogar a família")
        void contaBanidaDeveRevogarFamilia() {
            RefreshToken stored = buildStored(EXPIRES_AT);
            User user = buildUser();
            user.setBanned(true);

            stubValidRefreshJwt();
            when(refreshTokenRepository.findByToken(OLD_REFRESH)).thenReturn(Optional.of(stored));
            when(tokenPort.extractUserId(OLD_REFRESH)).thenReturn(USER_ID);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

            assertThatThrownBy(() -> refreshTokenUseCase.execute(new RefreshInput(OLD_REFRESH)))
                    .isInstanceOf(BusinessRuleException.class)
                    .extracting("statusCode", "errorCode")
                    .containsExactly(401, ApiErrorCode.AUTH_REFRESH_TOKEN_EXPIRED);

            verify(refreshTokenRepository).revokeFamily(FAMILY_ID);
            verify(refreshTokenRepository, never()).revokeIfActive(any());
            verify(tokenPort, never()).generateAccessToken(any(), any(), any());
        }

        @Test
        @DisplayName("Deve rejeitar token expirado na tabela")
        void deveRejeitarTokenExpirado() {
            RefreshInput input = new RefreshInput(OLD_REFRESH);
            RefreshToken stored = buildStored(LocalDateTime.now().minusDays(1));

            stubValidRefreshJwt();
            when(refreshTokenRepository.findByToken(OLD_REFRESH)).thenReturn(Optional.of(stored));

            assertThatThrownBy(() -> refreshTokenUseCase.execute(input))
                    .isInstanceOf(BusinessRuleException.class)
                    .extracting("statusCode")
                    .isEqualTo(401);

            verify(refreshTokenRepository, never()).revokeFamily(any());
            verify(tokenPort, never()).generateAccessToken(any(), any(), any());
        }

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando usuário não existe")
        void deveLancarExcecaoQuandoUsuarioNaoExiste() {
            RefreshInput input = new RefreshInput(OLD_REFRESH);
            RefreshToken stored = buildStored(EXPIRES_AT);

            stubValidRefreshJwt();
            when(refreshTokenRepository.findByToken(OLD_REFRESH)).thenReturn(Optional.of(stored));
            when(tokenPort.extractUserId(OLD_REFRESH)).thenReturn(USER_ID);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> refreshTokenUseCase.execute(input))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");

            verify(tokenPort, never()).generateAccessToken(any(), any(), any());
        }
    }
}
