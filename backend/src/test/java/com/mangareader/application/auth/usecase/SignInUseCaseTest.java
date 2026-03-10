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
import org.springframework.security.crypto.password.PasswordEncoder;

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.auth.usecase.SignInUseCase.SignInInput;
import com.mangareader.application.auth.usecase.SignInUseCase.SignInOutput;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.shared.exception.BusinessRuleException;

@ExtendWith(MockitoExtension.class)
@DisplayName("SignInUseCase")
class SignInUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private TokenPort tokenPort;

    @InjectMocks
    private SignInUseCase signInUseCase;

    private final UUID USER_ID = UUID.randomUUID();
    private final String EMAIL = "ruan@email.com";
    private final String PASSWORD = "senha123";
    private final String PASSWORD_HASH = "encoded_senha123";
    private final String ACCESS_TOKEN = "access.jwt.token";
    private final String REFRESH_TOKEN = "refresh.jwt.token";

    private User buildUser() {
        return User.builder()
                .id(USER_ID)
                .name("Ruan Silva")
                .email(EMAIL)
                .passwordHash(PASSWORD_HASH)
                .role(UserRole.MEMBER)
                .photoUrl("https://example.com/photo.jpg")
                .build();
    }

    @Nested
    @DisplayName("Cenário de sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve autenticar usuário e retornar tokens JWT com dados do usuário")
        void deveAutenticarUsuarioERetornarTokens() {
            // Arrange
            SignInInput input = new SignInInput(EMAIL, PASSWORD);
            User user = buildUser();

            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(passwordEncoder.matches(PASSWORD, PASSWORD_HASH)).thenReturn(true);
            when(tokenPort.generateAccessToken(USER_ID, EMAIL, "MEMBER")).thenReturn(ACCESS_TOKEN);
            when(tokenPort.generateRefreshToken(USER_ID)).thenReturn(REFRESH_TOKEN);

            // Act
            SignInOutput output = signInUseCase.execute(input);

            // Assert
            assertThat(output.accessToken()).isEqualTo(ACCESS_TOKEN);
            assertThat(output.refreshToken()).isEqualTo(REFRESH_TOKEN);
            assertThat(output.userId()).isEqualTo(USER_ID.toString());
            assertThat(output.name()).isEqualTo("Ruan Silva");
            assertThat(output.email()).isEqualTo(EMAIL);
            assertThat(output.role()).isEqualTo("MEMBER");
            assertThat(output.photoUrl()).isEqualTo("https://example.com/photo.jpg");
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar BusinessRuleException quando email não existe")
        void deveLancarExcecaoQuandoEmailNaoExiste() {
            // Arrange
            SignInInput input = new SignInInput("naoexiste@email.com", PASSWORD);
            when(userRepository.findByEmail("naoexiste@email.com")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> signInUseCase.execute(input))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessage("E-mail ou senha incorretos.");

            verify(passwordEncoder, never()).matches(any(), any());
            verify(tokenPort, never()).generateAccessToken(any(), any(), any());
        }

        @Test
        @DisplayName("Deve lançar BusinessRuleException quando senha está incorreta")
        void deveLancarExcecaoQuandoSenhaIncorreta() {
            // Arrange
            SignInInput input = new SignInInput(EMAIL, "senhaErrada");
            User user = buildUser();

            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("senhaErrada", PASSWORD_HASH)).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> signInUseCase.execute(input))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessage("E-mail ou senha incorretos.");

            verify(tokenPort, never()).generateAccessToken(any(), any(), any());
        }

        @Test
        @DisplayName("Deve retornar status 401 tanto para email quanto senha inválidos")
        void deveRetornarStatus401ParaCredenciaisInvalidas() {
            // Arrange
            SignInInput input = new SignInInput("naoexiste@email.com", PASSWORD);
            when(userRepository.findByEmail("naoexiste@email.com")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> signInUseCase.execute(input))
                    .isInstanceOf(BusinessRuleException.class)
                    .extracting("statusCode")
                    .isEqualTo(401);
        }
    }
}
