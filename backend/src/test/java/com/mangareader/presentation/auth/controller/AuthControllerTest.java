package com.mangareader.presentation.auth.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mangareader.application.auth.usecase.ForgotPasswordUseCase;
import com.mangareader.application.auth.usecase.GetCurrentUserUseCase;
import com.mangareader.application.auth.usecase.RefreshTokenUseCase;
import com.mangareader.application.auth.usecase.ResetPasswordUseCase;
import com.mangareader.application.auth.usecase.SignInUseCase;
import com.mangareader.application.auth.usecase.SignUpUseCase;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.UserRole;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("AuthController")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SignInUseCase signInUseCase;

    @MockitoBean
    private SignUpUseCase signUpUseCase;

    @MockitoBean
    private RefreshTokenUseCase refreshTokenUseCase;

    @MockitoBean
    private GetCurrentUserUseCase getCurrentUserUseCase;

    @MockitoBean
    private ForgotPasswordUseCase forgotPasswordUseCase;

    @MockitoBean
    private ResetPasswordUseCase resetPasswordUseCase;

    @Nested
    @DisplayName("POST /api/auth/sign-in")
    class SignIn {

        @Test
        @DisplayName("Deve retornar 200 com tokens e dados do usuário")
        void deveRetornar200ComTokens() throws Exception {
            var output = new SignInUseCase.SignInOutput(
                    "access-token", "refresh-token", UUID.randomUUID().toString(),
                    "Ruan", "ruan@email.com", "MEMBER", "https://photo.url");
            when(signInUseCase.execute(any())).thenReturn(output);

            mockMvc.perform(post("/api/auth/sign-in")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"email": "ruan@email.com", "password": "senha123"}
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.accessToken").value("access-token"))
                    .andExpect(jsonPath("$.data.refreshToken").value("refresh-token"))
                    .andExpect(jsonPath("$.data.name").value("Ruan"))
                    .andExpect(jsonPath("$.data.email").value("ruan@email.com"))
                    .andExpect(jsonPath("$.data.role").value("MEMBER"));
        }

        @Test
        @DisplayName("Deve retornar 400 quando email está em branco")
        void deveRetornar400EmailEmBranco() throws Exception {
            mockMvc.perform(post("/api/auth/sign-in")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"email": "", "password": "senha123"}
                                    """))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Deve retornar 400 quando email é inválido")
        void deveRetornar400EmailInvalido() throws Exception {
            mockMvc.perform(post("/api/auth/sign-in")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"email": "invalido", "password": "senha123"}
                                    """))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Deve retornar 400 quando senha está em branco")
        void deveRetornar400SenhaEmBranco() throws Exception {
            mockMvc.perform(post("/api/auth/sign-in")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"email": "ruan@email.com", "password": ""}
                                    """))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/auth/sign-up")
    class SignUp {

        @Test
        @DisplayName("Deve retornar 201 Created com tokens e dados do usuário")
        void deveRetornar201ComTokens() throws Exception {
            var output = new SignUpUseCase.SignUpOutput(
                    "access-token", "refresh-token", UUID.randomUUID().toString(),
                    "Novo User", "novo@email.com", "MEMBER");
            when(signUpUseCase.execute(any())).thenReturn(output);

            mockMvc.perform(post("/api/auth/sign-up")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"name": "Novo User", "email": "novo@email.com", "password": "senha123"}
                                    """))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.statusCode").value(201))
                    .andExpect(jsonPath("$.data.accessToken").value("access-token"))
                    .andExpect(jsonPath("$.data.name").value("Novo User"));
        }

        @Test
        @DisplayName("Deve retornar 400 quando nome tem menos de 2 caracteres")
        void deveRetornar400NomeCurto() throws Exception {
            mockMvc.perform(post("/api/auth/sign-up")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"name": "A", "email": "a@b.com", "password": "senha123"}
                                    """))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Deve retornar 400 quando senha tem menos de 6 caracteres")
        void deveRetornar400SenhaCurta() throws Exception {
            mockMvc.perform(post("/api/auth/sign-up")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"name": "Ruan", "email": "r@b.com", "password": "12345"}
                                    """))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Deve retornar 400 com múltiplos erros de validação")
        void deveRetornar400MultiplosErros() throws Exception {
            mockMvc.perform(post("/api/auth/sign-up")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"name": "", "email": "invalido", "password": ""}
                                    """))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/auth/refresh")
    class Refresh {

        @Test
        @DisplayName("Deve retornar 200 com novos tokens")
        void deveRetornar200ComNovosTokens() throws Exception {
            var output = new RefreshTokenUseCase.RefreshOutput("new-access", "new-refresh");
            when(refreshTokenUseCase.execute(any())).thenReturn(output);

            mockMvc.perform(post("/api/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"refreshToken": "old-refresh-token"}
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.accessToken").value("new-access"))
                    .andExpect(jsonPath("$.data.refreshToken").value("new-refresh"))
                    .andExpect(jsonPath("$.data.userId").doesNotExist())
                    .andExpect(jsonPath("$.data.name").doesNotExist());
        }

        @Test
        @DisplayName("Deve retornar 400 quando refreshToken está em branco")
        void deveRetornar400TokenEmBranco() throws Exception {
            mockMvc.perform(post("/api/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"refreshToken": ""}
                                    """))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/auth/me")
    class Me {

        @Test
        @DisplayName("Deve retornar 200 com dados do usuário sem tokens")
        void deveRetornar200SemTokens() throws Exception {
            UUID userId = UUID.randomUUID();
            User user = User.builder()
                    .id(userId).name("Ruan").email("ruan@email.com")
                    .passwordHash("h").role(UserRole.MEMBER).photoUrl("https://photo.url")
                    .build();
            when(getCurrentUserUseCase.execute(userId)).thenReturn(user);

            Authentication auth = org.mockito.Mockito.mock(Authentication.class);
            when(auth.getPrincipal()).thenReturn(userId);

            mockMvc.perform(get("/api/auth/me")
                            .principal(auth))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.userId").value(userId.toString()))
                    .andExpect(jsonPath("$.data.name").value("Ruan"))
                    .andExpect(jsonPath("$.data.email").value("ruan@email.com"))
                    .andExpect(jsonPath("$.data.role").value("MEMBER"))
                    .andExpect(jsonPath("$.data.accessToken").doesNotExist())
                    .andExpect(jsonPath("$.data.refreshToken").doesNotExist());
        }
    }

    @Nested
    @DisplayName("POST /api/auth/forgot-password")
    class ForgotPassword {

        @Test
        @DisplayName("Deve retornar 200 com mensagem genérica")
        void deveRetornar200ComMensagemGenerica() throws Exception {
            mockMvc.perform(post("/api/auth/forgot-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"email": "ruan@email.com"}
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));

            verify(forgotPasswordUseCase).execute("ruan@email.com");
        }

        @Test
        @DisplayName("Deve retornar 400 quando email é inválido")
        void deveRetornar400EmailInvalido() throws Exception {
            mockMvc.perform(post("/api/auth/forgot-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"email": "invalido"}
                                    """))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/auth/reset-password")
    class ResetPassword {

        @Test
        @DisplayName("Deve retornar 200 com mensagem de sucesso")
        void deveRetornar200ComMensagemDeSucesso() throws Exception {
            mockMvc.perform(post("/api/auth/reset-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"token": "valid-reset-token", "newPassword": "novaSenha123"}
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));

            verify(resetPasswordUseCase).execute("valid-reset-token", "novaSenha123");
        }

        @Test
        @DisplayName("Deve retornar 400 quando token está em branco")
        void deveRetornar400TokenEmBranco() throws Exception {
            mockMvc.perform(post("/api/auth/reset-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"token": "", "newPassword": "novaSenha123"}
                                    """))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Deve retornar 400 quando senha é curta")
        void deveRetornar400SenhaCurta() throws Exception {
            mockMvc.perform(post("/api/auth/reset-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"token": "valid-token", "newPassword": "123"}
                                    """))
                    .andExpect(status().isBadRequest());
        }
    }
}
