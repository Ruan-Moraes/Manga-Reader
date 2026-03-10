package com.mangareader.application.auth.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.auth.usecase.SignUpUseCase.SignUpInput;
import com.mangareader.application.auth.usecase.SignUpUseCase.SignUpOutput;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.shared.exception.DuplicateResourceException;

@ExtendWith(MockitoExtension.class)
@DisplayName("SignUpUseCase")
class SignUpUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private TokenPort tokenPort;

    @InjectMocks
    private SignUpUseCase signUpUseCase;

    private final String NAME = "Ruan Silva";
    private final String EMAIL = "ruan@email.com";
    private final String PASSWORD = "senha123";
    private final String ENCODED_PASSWORD = "encoded_senha123";
    private final UUID USER_ID = UUID.randomUUID();
    private final String ACCESS_TOKEN = "access.jwt.token";
    private final String REFRESH_TOKEN = "refresh.jwt.token";

    @Nested
    @DisplayName("Cenário de sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve cadastrar usuário e retornar tokens JWT")
        void deveCadastrarUsuarioERetornarTokens() {
            // Arrange
            SignUpInput input = new SignUpInput(NAME, EMAIL, PASSWORD);

            when(userRepository.existsByEmail(EMAIL)).thenReturn(false);
            when(passwordEncoder.encode(PASSWORD)).thenReturn(ENCODED_PASSWORD);
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                user.setId(USER_ID);
                return user;
            });
            when(tokenPort.generateAccessToken(USER_ID, EMAIL, "MEMBER")).thenReturn(ACCESS_TOKEN);
            when(tokenPort.generateRefreshToken(USER_ID)).thenReturn(REFRESH_TOKEN);

            // Act
            SignUpOutput output = signUpUseCase.execute(input);

            // Assert
            assertThat(output.accessToken()).isEqualTo(ACCESS_TOKEN);
            assertThat(output.refreshToken()).isEqualTo(REFRESH_TOKEN);
            assertThat(output.userId()).isEqualTo(USER_ID.toString());
            assertThat(output.name()).isEqualTo(NAME);
            assertThat(output.email()).isEqualTo(EMAIL);
            assertThat(output.role()).isEqualTo("MEMBER");
        }

        @Test
        @DisplayName("Deve salvar usuário com senha codificada e role MEMBER")
        void deveSalvarUsuarioComSenhaCodeificadaERoleMember() {
            // Arrange
            SignUpInput input = new SignUpInput(NAME, EMAIL, PASSWORD);

            when(userRepository.existsByEmail(EMAIL)).thenReturn(false);
            when(passwordEncoder.encode(PASSWORD)).thenReturn(ENCODED_PASSWORD);
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                user.setId(USER_ID);
                return user;
            });
            when(tokenPort.generateAccessToken(any(), any(), any())).thenReturn(ACCESS_TOKEN);
            when(tokenPort.generateRefreshToken(any())).thenReturn(REFRESH_TOKEN);

            // Act
            signUpUseCase.execute(input);

            // Assert
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());

            User savedUser = userCaptor.getValue();
            assertThat(savedUser.getName()).isEqualTo(NAME);
            assertThat(savedUser.getEmail()).isEqualTo(EMAIL);
            assertThat(savedUser.getPasswordHash()).isEqualTo(ENCODED_PASSWORD);
            assertThat(savedUser.getRole()).isEqualTo(UserRole.MEMBER);
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar DuplicateResourceException quando email já existe")
        void deveLancarExcecaoQuandoEmailJaExiste() {
            // Arrange
            SignUpInput input = new SignUpInput(NAME, EMAIL, PASSWORD);
            when(userRepository.existsByEmail(EMAIL)).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> signUpUseCase.execute(input))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining(EMAIL);

            verify(userRepository, never()).save(any());
            verify(tokenPort, never()).generateAccessToken(any(), any(), any());
        }
    }
}
