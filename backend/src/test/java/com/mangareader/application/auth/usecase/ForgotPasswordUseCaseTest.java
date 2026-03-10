package com.mangareader.application.auth.usecase;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.shared.port.EmailPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.UserRole;

@ExtendWith(MockitoExtension.class)
@DisplayName("ForgotPasswordUseCase")
class ForgotPasswordUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private TokenPort tokenPort;

    @Mock
    private EmailPort emailPort;

    @InjectMocks
    private ForgotPasswordUseCase forgotPasswordUseCase;

    private final UUID USER_ID = UUID.randomUUID();
    private final String EMAIL = "ruan@email.com";
    private final String RESET_TOKEN = "reset.jwt.token";
    private final String BASE_URL = "http://localhost:5173";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(forgotPasswordUseCase, "baseUrl", BASE_URL);
    }

    private User buildUser() {
        return User.builder()
                .id(USER_ID)
                .name("Ruan Silva")
                .email(EMAIL)
                .passwordHash("hash")
                .role(UserRole.MEMBER)
                .build();
    }

    @Nested
    @DisplayName("Cenário de sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve gerar token de reset e enviar email quando usuário existe")
        void deveGerarTokenEEnviarEmailQuandoUsuarioExiste() {
            // Arrange
            User user = buildUser();

            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(tokenPort.generatePasswordResetToken(USER_ID, EMAIL)).thenReturn(RESET_TOKEN);

            // Act
            forgotPasswordUseCase.execute(EMAIL);

            // Assert
            verify(tokenPort).generatePasswordResetToken(USER_ID, EMAIL);
            verify(emailPort).sendHtml(
                    eq(EMAIL),
                    eq("Manga Reader — Recuperação de Senha"),
                    contains(BASE_URL + "/reset-password?token=" + RESET_TOKEN)
            );
        }

        @Test
        @DisplayName("Deve incluir nome do usuário no corpo do email")
        void deveIncluirNomeDoUsuarioNoEmail() {
            // Arrange
            User user = buildUser();

            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(tokenPort.generatePasswordResetToken(USER_ID, EMAIL)).thenReturn(RESET_TOKEN);

            // Act
            forgotPasswordUseCase.execute(EMAIL);

            // Assert
            verify(emailPort).sendHtml(
                    eq(EMAIL),
                    any(),
                    contains("Ruan Silva")
            );
        }
    }

    @Nested
    @DisplayName("Cenários de segurança")
    class Seguranca {

        @Test
        @DisplayName("Não deve lançar exceção quando email não existe (segurança)")
        void naoDeveLancarExcecaoQuandoEmailNaoExiste() {
            // Arrange
            when(userRepository.findByEmail("naoexiste@email.com")).thenReturn(Optional.empty());

            // Act — não deve lançar exceção
            forgotPasswordUseCase.execute("naoexiste@email.com");

            // Assert
            verify(tokenPort, never()).generatePasswordResetToken(any(), any());
            verify(emailPort, never()).sendHtml(any(), any(), any());
        }
    }
}
