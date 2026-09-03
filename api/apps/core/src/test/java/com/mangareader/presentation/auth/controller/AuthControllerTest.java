package com.mangareader.presentation.auth.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.util.UUID;

import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;

import jakarta.servlet.http.Cookie;
import org.mockito.ArgumentCaptor;

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
import com.mangareader.application.auth.usecase.LogoutUseCase;
import com.mangareader.application.auth.usecase.RefreshTokenUseCase;
import com.mangareader.application.auth.usecase.ResetPasswordUseCase;
import com.mangareader.application.auth.usecase.SignInUseCase;
import com.mangareader.application.auth.usecase.SignUpUseCase;
import com.mangareader.application.user.service.UserProfileSettingsResolver;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserProfileSettings;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.presentation.auth.support.RefreshTokenCookieFactory;
import com.mangareader.application.auth.port.TokenPort;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(RefreshTokenCookieFactory.class)
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
    private LogoutUseCase logoutUseCase;

    @MockitoBean
    private GetCurrentUserUseCase getCurrentUserUseCase;

    @MockitoBean
    private ForgotPasswordUseCase forgotPasswordUseCase;

    @MockitoBean
    private ResetPasswordUseCase resetPasswordUseCase;

    @MockitoBean
    private UserProfileSettingsResolver profileSettingsResolver;

    @MockitoBean
    private TokenPort tokenPort;

    @MockitoBean
    private com.mangareader.shared.config.AuthProperties authProperties;

    @MockitoBean
    private com.mangareader.infrastructure.security.jwt.JwtProperties jwtProperties;

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
                            .header(AuthController.REFRESH_TRANSPORT_HEADER, "body")
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
        @DisplayName("Deve setar cookie httpOnly do refresh token com flags corretas")
        void deveSetarCookieHttpOnly() throws Exception {
            var output = new SignInUseCase.SignInOutput(
                    "access-token", "refresh-token", UUID.randomUUID().toString(),
                    "Ruan", "ruan@email.com", "MEMBER", null);
            when(signInUseCase.execute(any())).thenReturn(output);

            var result = mockMvc.perform(post("/api/auth/sign-in")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"email": "ruan@email.com", "password": "senha123"}
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(cookie().exists("refresh_token"))
                    .andExpect(cookie().value("refresh_token", "refresh-token"))
                    .andExpect(cookie().httpOnly("refresh_token", true))
                    .andExpect(cookie().path("refresh_token", "/api/auth"))
                    .andReturn();

            assertThat(result.getResponse().getHeader(HttpHeaders.SET_COOKIE))
                    .contains("SameSite=Strict");
        }

        @Test
        void cookieTransportDoesNotExposeRefreshTokenInTheResponseBody() throws Exception {
            when(signInUseCase.execute(any())).thenReturn(new SignInUseCase.SignInOutput(
                    "access-token", "refresh-token", UUID.randomUUID().toString(),
                    "Ruan", "ruan@email.com", "MEMBER", null));

            mockMvc.perform(post("/api/auth/sign-in")
                            .header(AuthController.REFRESH_TRANSPORT_HEADER, "cookie")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"email": "ruan@email.com", "password": "senha123"}
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.accessToken").value("access-token"))
                    .andExpect(jsonPath("$.data.refreshToken").doesNotExist())
                    .andExpect(cookie().value("refresh_token", "refresh-token"));
        }

        @Test
        @DisplayName("Deve retornar 400 quando email está em branco")
        void deveRetornar400EmailEmBranco() throws Exception {
            mockMvc.perform(post("/api/auth/sign-in")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"email": "", "password": "senha123"}
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("VALIDATION_FIELD_ERROR"))
                    .andExpect(jsonPath("$.statusCode").value(400))
                    .andExpect(jsonPath("$.fieldErrors.email").exists());
        }

        @Test
        @DisplayName("Deve retornar 400 quando email é inválido")
        void deveRetornar400EmailInvalido() throws Exception {
            mockMvc.perform(post("/api/auth/sign-in")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"email": "invalido", "password": "senha123"}
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("VALIDATION_FIELD_ERROR"))
                    .andExpect(jsonPath("$.statusCode").value(400))
                    .andExpect(jsonPath("$.fieldErrors.email").exists());
        }

        @Test
        @DisplayName("Deve retornar 400 quando senha está em branco")
        void deveRetornar400SenhaEmBranco() throws Exception {
            mockMvc.perform(post("/api/auth/sign-in")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"email": "ruan@email.com", "password": ""}
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("VALIDATION_FIELD_ERROR"))
                    .andExpect(jsonPath("$.statusCode").value(400))
                    .andExpect(jsonPath("$.fieldErrors.password").exists());
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
                            .header(AuthController.REFRESH_TRANSPORT_HEADER, "body")
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
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("VALIDATION_FIELD_ERROR"))
                    .andExpect(jsonPath("$.statusCode").value(400))
                    .andExpect(jsonPath("$.fieldErrors.name").exists());
        }

        @Test
        @DisplayName("Deve retornar 400 quando senha tem menos de 6 caracteres")
        void deveRetornar400SenhaCurta() throws Exception {
            mockMvc.perform(post("/api/auth/sign-up")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"name": "Ruan", "email": "r@b.com", "password": "12345"}
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("VALIDATION_FIELD_ERROR"))
                    .andExpect(jsonPath("$.statusCode").value(400))
                    .andExpect(jsonPath("$.fieldErrors.password").exists());
        }

        @Test
        @DisplayName("Deve retornar 400 com múltiplos erros de validação")
        void deveRetornar400MultiplosErros() throws Exception {
            mockMvc.perform(post("/api/auth/sign-up")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"name": "", "email": "invalido", "password": ""}
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("VALIDATION_FIELD_ERROR"))
                    .andExpect(jsonPath("$.statusCode").value(400))
                    .andExpect(jsonPath("$.fieldErrors.name").exists())
                    .andExpect(jsonPath("$.fieldErrors.email").exists())
                    .andExpect(jsonPath("$.fieldErrors.password").exists());
        }
    }

    @Nested
    @DisplayName("POST /api/auth/refresh")
    class Refresh {

        @Test
        @DisplayName("Deve retornar 200 com novos tokens via body (contrato mobile)")
        void deveRetornar200ComNovosTokensViaBody() throws Exception {
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
        @DisplayName("Deve aceitar refresh via cookie httpOnly e rotacionar o cookie")
        void deveAceitarRefreshViaCookie() throws Exception {
            var output = new RefreshTokenUseCase.RefreshOutput("new-access", "new-refresh");

            when(refreshTokenUseCase.execute(any())).thenReturn(output);

            mockMvc.perform(post("/api/auth/refresh")
                            .cookie(new Cookie("refresh_token", "cookie-refresh-token")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.accessToken").value("new-access"))
                    .andExpect(jsonPath("$.data.refreshToken").doesNotExist())
                    .andExpect(cookie().value("refresh_token", "new-refresh"));

            var captor = ArgumentCaptor.forClass(RefreshTokenUseCase.RefreshInput.class);
            verify(refreshTokenUseCase).execute(captor.capture());
            assertThat(captor.getValue().refreshToken()).isEqualTo("cookie-refresh-token");
        }

        @Test
        @DisplayName("Cookie deve ter precedência sobre o body")
        void cookieTemPrecedenciaSobreBody() throws Exception {
            when(refreshTokenUseCase.execute(any()))
                    .thenReturn(new RefreshTokenUseCase.RefreshOutput("a", "r"));

            mockMvc.perform(post("/api/auth/refresh")
                            .cookie(new Cookie("refresh_token", "cookie-token"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"refreshToken": "body-token"}
                                    """))
                    .andExpect(status().isOk());

            var captor = ArgumentCaptor.forClass(RefreshTokenUseCase.RefreshInput.class);
            verify(refreshTokenUseCase).execute(captor.capture());
            assertThat(captor.getValue().refreshToken()).isEqualTo("cookie-token");
        }

        @Test
        @DisplayName("Deve retornar 401 sem cookie e sem body")
        void deveRetornar401SemToken() throws Exception {
            mockMvc.perform(post("/api/auth/refresh"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("AUTH_REFRESH_TOKEN_EXPIRED"));
        }

        @Test
        @DisplayName("Deve retornar 401 quando refreshToken do body está em branco")
        void deveRetornar401TokenEmBranco() throws Exception {
            mockMvc.perform(post("/api/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"refreshToken": ""}
                                    """))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("AUTH_REFRESH_TOKEN_EXPIRED"));
        }
    }

    @Nested
    @DisplayName("POST /api/auth/logout")
    class Logout {

        @Test
        @DisplayName("Deve revogar via cookie e expirar o cookie (Max-Age=0)")
        void deveRevogarViaCookieEExpirarCookie() throws Exception {
            mockMvc.perform(post("/api/auth/logout")
                            .cookie(new Cookie("refresh_token", "cookie-refresh-token")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(cookie().maxAge("refresh_token", 0));

            verify(logoutUseCase).execute("cookie-refresh-token");
        }

        @Test
        @DisplayName("Deve aceitar logout via body (contrato mobile)")
        void deveAceitarLogoutViaBody() throws Exception {
            mockMvc.perform(post("/api/auth/logout")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"refreshToken": "body-refresh-token"}
                                    """))
                    .andExpect(status().isOk());

            verify(logoutUseCase).execute("body-refresh-token");
        }

        @Test
        @DisplayName("Logout sem token deve responder 200 (idempotente) e limpar cookie")
        void logoutSemTokenIdempotente() throws Exception {
            mockMvc.perform(post("/api/auth/logout"))
                    .andExpect(status().isOk())
                    .andExpect(cookie().maxAge("refresh_token", 0));

            verify(logoutUseCase).execute(null);
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
            when(profileSettingsResolver.getOrDefault(user)).thenReturn(UserProfileSettings.defaults(user));

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
            when(forgotPasswordUseCase.execute("ruan@email.com")).thenReturn(Duration.ofMinutes(30));

            mockMvc.perform(post("/api/auth/forgot-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"email": "ruan@email.com"}
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.message").value("Se o email estiver cadastrado, um link de redefinição será enviado."))
                    .andExpect(jsonPath("$.data.expiresInSeconds").value(1800));

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
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("VALIDATION_FIELD_ERROR"))
                    .andExpect(jsonPath("$.statusCode").value(400))
                    .andExpect(jsonPath("$.fieldErrors.email").exists());
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
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("VALIDATION_FIELD_ERROR"))
                    .andExpect(jsonPath("$.statusCode").value(400))
                    .andExpect(jsonPath("$.fieldErrors.token").exists());
        }

        @Test
        @DisplayName("Deve retornar 400 quando senha é curta")
        void deveRetornar400SenhaCurta() throws Exception {
            mockMvc.perform(post("/api/auth/reset-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"token": "valid-token", "newPassword": "123"}
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("VALIDATION_FIELD_ERROR"))
                    .andExpect(jsonPath("$.statusCode").value(400))
                    .andExpect(jsonPath("$.fieldErrors.newPassword").exists());
        }
    }
}
